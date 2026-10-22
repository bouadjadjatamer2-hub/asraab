import type { ClientRequest, IncomingMessage } from 'node:http'
import { net } from 'electron'
import type { HttpConnection, ResponseStart } from '../network/routes'

/** The same shape as StreamConnection, but carried by Chromium's network stack.
 *
 * Some servers (Cloudflare and the filters like it) refuse a request that isn't from a browser
 * even when every header matches: they fingerprint the TLS handshake. Node's handshake is not a
 * browser's, Chromium's is, so these downloads go through Electron's `net` module instead.
 *
 * The trade-off is that Chromium picks the route: a socket can't be pinned to a network, so the
 * download runs over the system's default one rather than being spread across all of them. */
export class ChromiumConnection implements HttpConnection {
  private readonly inFlight = new Set<ClientRequest>()
  private closed = false

  constructor(private readonly timeoutMs: number) {}

  request(
    target: URL,
    headers: Record<string, string>,
    signal?: AbortSignal
  ): Promise<ResponseStart> {
    return new Promise((resolve, reject) => {
      if (this.closed || signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }
      const sentAt = Date.now()
      const request = net.request({ method: 'GET', url: target.toString(), redirect: 'follow' })
      for (const [name, value] of Object.entries(headers)) request.setHeader(name, value)
      this.inFlight.add(request as unknown as ClientRequest)

      let answered = false
      let timedOut = false
      const settle = (): void => {
        clearTimeout(timer)
        signal?.removeEventListener('abort', onAbort)
        this.inFlight.delete(request as unknown as ClientRequest)
      }
      const onAbort = (): void => {
        request.abort()
      }
      const timer = setTimeout(() => {
        timedOut = true
        request.abort()
      }, this.timeoutMs)

      request.on('response', (response) => {
        answered = true
        settle()
        resolve({
          req: request as unknown as ClientRequest,
          res: response as unknown as IncomingMessage,
          sentAt
        })
      })
      request.on('error', (error) => {
        settle()
        if (answered) return
        reject(
          timedOut
            ? new Error('Connection stalled: no response from server')
            : new Error(error.message, { cause: error })
        )
      })
      signal?.addEventListener('abort', onAbort, { once: true })
      request.end()
    })
  }

  /** Nothing is kept open between requests here; Chromium manages its own pool. */
  reconnect(): void {
    // Chromium's pool is internal; there is no routed socket of ours to drop.
  }

  close(): void {
    this.closed = true
    for (const request of this.inFlight) request.destroy()
    this.inFlight.clear()
  }
}
