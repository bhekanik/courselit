# shellcheck shell=bash
# Usage: media.sh <preflight|signature|seal|get> <argument>

[ "$#" -eq 2 ] || r_die "media operation and argument are required"
operation="$1"
argument="$2"

case "$operation" in
preflight | signature | seal | get) ;;
*) r_die "unsupported media operation" ;;
esac

medialit_id="$(require_service_id medialit)"
[ "$(docker inspect --format '{{.State.Status}}' "$medialit_id")" = running ] ||
    r_die "MediaLit container is not running"
app_id="$(require_service_id app)"
docker exec "$app_id" node -e '
const operation = process.argv[1];
const argument = process.argv[2];
const endpoint = process.env.MEDIALIT_SERVER;
const key = process.env.MEDIALIT_APIKEY;
if (!endpoint || !key) {
  console.error("MediaLit configuration is missing in the app container");
  process.exit(2);
}
let server;
try {
  server = new URL(endpoint);
} catch {
  console.error("MediaLit endpoint is invalid in the app container");
  process.exit(2);
}

async function request(path, body) {
  const response = await fetch(new URL(path, server), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-medialit-apikey": key,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    console.error("MediaLit " + operation + " request returned HTTP " + response.status);
    process.exit(1);
  }
  let data;
  try {
    data = await response.json();
  } catch {
    console.error("MediaLit " + operation + " response was not JSON");
    process.exit(1);
  }
  return data;
}

async function main() {
  if (operation === "preflight") return;
  if (operation === "signature") {
    const data = await request("media/signature/create", { group: argument });
    if (typeof data.signature !== "string" || !data.signature) {
      console.error("MediaLit signature response was invalid");
      process.exit(1);
    }
    process.stdout.write(data.signature);
    return;
  }
  const data = await request("media/" + operation + "/" + encodeURIComponent(argument));
  process.stdout.write(JSON.stringify(data));
}

main().catch(() => {
  console.error("MediaLit " + operation + " request failed");
  process.exit(1);
});
' "$operation" "$argument"
