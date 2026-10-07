// The Onus release the site points at. Downloads always resolve to the latest
// release on GitHub; the tag is shown in the GitHub Action example, so update
// it when a new version ships.
export const repo = "https://github.com/onushq/onus";
export const tag = "v0.2.0";

const latest = `${repo}/releases/latest/download`;

export const downloads = [
  { os: "macOS", arch: "Apple silicon", target: "aarch64-apple-darwin", ext: "tar.gz" },
  { os: "macOS", arch: "Intel", target: "x86_64-apple-darwin", ext: "tar.gz" },
  { os: "Linux", arch: "x86-64", target: "x86_64-unknown-linux-musl", ext: "tar.gz" },
  { os: "Linux", arch: "ARM64", target: "aarch64-unknown-linux-musl", ext: "tar.gz" },
  { os: "Windows", arch: "x86-64", target: "x86_64-pc-windows-msvc", ext: "zip" },
].map((d) => {
  const file = `onus-${d.target}.${d.ext}`;
  return { ...d, file, url: `${latest}/${file}`, checksum: `${latest}/${file}.sha256` };
});

export const installCommand = "curl -fsSL https://onushq.com/install.sh | sh";
export const brewCommand = "brew install onushq/tap/onus";
export const installScript = `${latest}/install.sh`;
