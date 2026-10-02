// The keys of a Signature the host reads: the Signature type of @digitaplatform/theme. A key outside
// them ships in the manifest and does nothing, so gen-signature refuses it. A test holds the list
// equal to the published type.
export const SIGNATURE_KEYS = ['id', 'name', 'accent', 'fonts', 'family', 'monogram', 'wordmark', 'colors', 'graphics'];

/** The keys of `signature` the host does not read. */
export const unreadSignatureKeys = (signature) => Object.keys(signature).filter((key) => !SIGNATURE_KEYS.includes(key));
