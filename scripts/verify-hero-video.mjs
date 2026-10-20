// Validate the external hero asset during preview builds; no credentials required.
const source = "https://assets.mixkit.co/videos/preview/mixkit-people-working-in-the-office-42617-large.mp4";
const response = await fetch(source, { headers: { Range: "bytes=0-1023" }, signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error("Hero footage unavailable: HTTP " + response.status);
const reader = response.body.getReader();
const {value} = await reader.read();
await reader.cancel();
if (!value || !Buffer.from(value).includes(Buffer.from("ftyp"))) throw new Error("Hero footage did not return an MP4 file");
console.log("Verified hero MP4 from Mixkit. Content-Type:",response.headers.get("content-type"));
