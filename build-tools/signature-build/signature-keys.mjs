// The keys of a Signature the host reads: the Signature type of @digitaplatform/theme. A key outside
// them ships in the manifest and does nothing, so gen-signature refuses it. A test holds the list
// equal to the published type.
export const SIGNATURE_KEYS = ['id', 'name', 'accent', 'fonts', 'family', 'monogram', 'wordmark', 'icon', 'colors', 'graphics'];

/** The keys of `signature` the host does not read. */
export const unreadSignatureKeys = (signature) => Object.keys(signature).filter((key) => !SIGNATURE_KEYS.includes(key));

/**
 * The delivery manifest of a signature package: the commercial and type fields of its `digita` block,
 * then every key of `SIGNATURE_KEYS` the signature holds, in that order, so diffs stay readable.
 */
export function signatureManifest(digita, signature) {
  const manifest = { id: digita.id, type: 'signature', tier: digita.tier, sdk: digita.sdk, displayName: digita.displayName ?? signature.name };
  for (const key of SIGNATURE_KEYS) {
    if (key !== 'id' && signature[key] !== undefined) manifest[key] = signature[key];
  }
  return manifest;
}
