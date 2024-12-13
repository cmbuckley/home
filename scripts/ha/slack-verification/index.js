// const SLACK_SIGNING_SECRET = 'environmnent_variable'
const SIGN_VERSION = 'v0'

/**
 * Verify that a request came from Slack
 *
 * Slack documentation:
 * https://api.slack.com/authentication/verifying-requests-from-slack
 *
 * @param {Request} request incoming request purportedly from Slack
 * @return {Promise<[boolean, string, number]>} whether verification was valid, and a reason
 */
async function verifySlackSignature(request) {
    const timestamp = request.headers.get('x-slack-request-timestamp')
    const now = Math.floor(Date.now() / 1000)

    if (request.method != 'POST') {
      return [false, 'bad_method', 405];
    }

    // fail if request is older than 5 minutes
    if (!timestamp || (now - timestamp) > (5 * 60)) {
      return [false, 'stale', 403];
    }

    const [signatureVersion, signature] = (request.headers.get('x-slack-signature') || '').split('=')

    if (signatureVersion != SIGN_VERSION) {
      return [false, 'unknown_signature_version', 403]
    }

    const body = await request.text()
    const authString = `${SIGN_VERSION}:${timestamp}:${body}`

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(SLACK_SIGNING_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    )
    const verified = await crypto.subtle.verify(
        'HMAC',
        key,
        hexToBytes(signature),
        encoder.encode(authString)
    )

    if (!verified) {
      return [false, 'invalid_signature', 403]
    }

    return [true, 'success', 200]
}

/**
 * Modified version of hex to bytes function posted here:
 * https://stackoverflow.com/a/34356351/489667
 *
 * @param {string} hex a string of hexadecimal characters
 * @return {ArrayBuffer} binary form of the hexadecimal string
 */
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2)
    for (let c = 0; c < hex.length; c += 2) {
        bytes[c / 2] = parseInt(hex.substr(c, 2), 16)
    }

    return bytes.buffer
}

/**
 * Handle the request sent to the worker
 *
 * @param {Request} request incoming request
 * @return {Promise<Response>} response to send back
 */
async function handleRequest(request) {
  const [valid, reason, status] = await verifySlackSignature(await request.clone())

  if (valid) {
    return await fetch(request)
  }

  return new Response(reason, {status})
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
