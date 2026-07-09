import axios, { type AxiosInstance } from "axios";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { CookieJar } from "tough-cookie";

const BASE_URL = process.env.CRM_BASE_URL ?? "https://volunteers.lightchannels.com";

export type OrgSearchParams = {
  name?: string;
  city?: string;
  pin?: string;
  address?: string;
  orgnId?: string;
};

export type OrgSearchResult = {
  orgnId: string;
  name: string;
  address: string;
  city: string;
  pincode: string;
};

export type OrgSession = {
  date: string;
  time: string;
  headcount: string;
  sessionType: string;
  volunteer: string;
  presenter: string;
  areaCoordinator: string;
  registered: string;
  remarks: string;
};

export type OrgDetail = {
  orgnId: string;
  type: string;
  name: string;
  address: string;
  zone: string;
  contact1: string;
  contact2: string;
  remarks: string;
  /** Newest first, matching the CRM's own ordering. */
  sessions: OrgSession[];
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

// Vercel functions are stateless between invocations, so each call logs in
// fresh with a request-scoped cookie jar rather than trying to persist a
// CRM session across requests.
async function createAuthenticatedClient(): Promise<AxiosInstance> {
  const username = requireEnv("CRM_USERNAME");
  const password = requireEnv("CRM_PASSWORD");

  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      baseURL: BASE_URL,
      jar,
      withCredentials: true,
      validateStatus: () => true,
    }),
  );

  const loginResponse = await client.post(
    "/LC_login.php",
    new URLSearchParams({ myusername: username, mypassword: password, Submit: "Login" }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  if (typeof loginResponse.data === "string" && loginResponse.data.includes("Volunteers Login")) {
    throw new Error("CRM login failed — check CRM_USERNAME / CRM_PASSWORD.");
  }

  return client;
}

export async function searchOrg(params: OrgSearchParams): Promise<OrgSearchResult[]> {
  const client = await createAuthenticatedClient();
  const response = await client.get("/vol_orgnlist.php", {
    params: {
      name: params.name ?? "",
      city: params.city ?? "",
      pin: params.pin ?? "",
      address: params.address ?? "",
      orgn_id: params.orgnId ?? "",
      ca_type: "",
      main_area: "",
      sub_area: "",
      page: 1,
    },
  });

  return parseOrgList(String(response.data));
}

export async function getOrgDetail(orgnId: string): Promise<OrgDetail> {
  const client = await createAuthenticatedClient();
  const response = await client.get("/vol_session.php", { params: { id: orgnId } });
  return parseOrgDetail(String(response.data));
}

// Cell text can span multiple lines via <br>, e.g. a multi-line address.
// This joins those lines into a single readable, comma-separated string.
function cellLines($cell: cheerio.Cheerio<AnyNode>): string {
  const html = $cell.html() ?? "";
  return html
    .split(/<br\s*\/?>/i)
    .map((line) => cheerio.load(`<div>${line}</div>`)("div").text().replace(/ /g, " ").trim())
    .filter(Boolean)
    .join(", ");
}

function parseOrgList(html: string): OrgSearchResult[] {
  const $ = cheerio.load(html);
  const results: OrgSearchResult[] = [];

  $("table").each((_, table) => {
    const $table = $(table);
    const headerText = $table.find("tr").first().text();
    if (!/Orgn\.?\s*Id/i.test(headerText)) return;

    $table
      .find("tr")
      .slice(1)
      .each((_, row) => {
        const cells = $(row).find("td");
        if (cells.length < 5) return;
        const orgnId = $(cells[0]).text().trim();
        if (!orgnId || Number.isNaN(Number(orgnId))) return;
        results.push({
          orgnId,
          name: $(cells[1]).text().trim(),
          address: cellLines($(cells[2])),
          city: $(cells[3]).text().trim(),
          pincode: $(cells[4]).text().trim(),
        });
      });
  });

  return results;
}

function parseOrgDetail(html: string): OrgDetail {
  const $ = cheerio.load(html);

  const fields: { label: string; value: string }[] = [];
  $("table.frmtbl_vol tr").each((_, row) => {
    const cells = $(row).find("td");
    // Real label:value rows always have a ":" delimiter cell; spacer rows
    // (a single blank <td>) don't, so this naturally skips them.
    if (cells.length < 3 || $(cells[1]).text().trim() !== ":") return;
    fields.push({
      label: $(cells[0]).text().trim().replace(/:$/, ""),
      value: cellLines($(cells[2])),
    });
  });

  const get = (label: string) =>
    fields.find((field) => field.label.toLowerCase() === label.toLowerCase())?.value ?? "";

  const sessions: OrgSession[] = [];
  $("#List_tbl table tr").each((_, row) => {
    const $row = $(row);
    if ($row.find("th").length > 0) return;
    const cells = $row.find("td");
    if (cells.length < 9) return;
    const text = (index: number) => $(cells[index]).text().replace(/ /g, " ").trim();
    sessions.push({
      date: text(0),
      time: text(1),
      headcount: text(2),
      sessionType: text(3),
      volunteer: text(4),
      presenter: text(5),
      areaCoordinator: text(6),
      registered: text(7),
      remarks: text(8),
    });
  });

  return {
    orgnId: get("Organisation Id"),
    type: get("Organisation Type"),
    name: get("Organisation Name"),
    address: get("Organisation Address"),
    zone: get("Zone & Sub Area"),
    contact1: get("Contact Details 1 (Name, Phone1, Phone2)"),
    contact2: get("Contact Details 2 (Name, Phone)"),
    remarks: get("Remarks"),
    sessions,
  };
}
