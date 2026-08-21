import client from "./client";

export async function getProvinces() {
  const { data } = await client.get("/reference/provinces");
  return data.provinces;
}
