export interface SSEMessage {
  readonly event: string;
  readonly data: string;
  readonly id?: string;
}

/**
 * Incremental Server-Sent-Events parser over text chunks. Handles LF/CR/CRLF, comments and
 * multi-line data. Leniently dispatches a final event that lacks the terminating blank line.
 */
export async function* parseSSE(chunks: AsyncIterable<string>): AsyncGenerator<SSEMessage> {
  let buffer = '';
  let event = 'message';
  let data: string[] = [];
  let id: string | undefined;

  const dispatch = (): SSEMessage | undefined => {
    const msg = data.length
      ? { event, data: data.join('\n'), ...(id !== undefined ? { id } : {}) }
      : undefined;
    event = 'message';
    data = [];
    return msg;
  };
  const field = (line: string): void => {
    if (line.startsWith(':')) return;
    const colon = line.indexOf(':');
    const name = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '');
    if (name === 'event') event = value;
    else if (name === 'data') data.push(value);
    else if (name === 'id') id = value;
  };

  for await (const chunk of chunks) {
    buffer += chunk;
    let newline: number;
    while ((newline = buffer.search(/\r\n|\r|\n/)) >= 0) {
      // A trailing lone CR may be the first half of CRLF split across chunks — wait for more input.
      if (buffer[newline] === '\r' && newline === buffer.length - 1) break;
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + (buffer.startsWith('\r\n', newline) ? 2 : 1));
      if (line === '') {
        const msg = dispatch();
        if (msg) yield msg;
      } else field(line);
    }
  }
  if (buffer) field(buffer);
  const last = dispatch();
  if (last) yield last;
}

/** Structural subset of a WHATWG `ReadableStream<Uint8Array>` (RN typings lack the global). */
export interface ByteStream {
  getReader(): { read(): Promise<{ done: boolean; value?: Uint8Array }>; releaseLock(): void };
}

interface TextDecoderLike {
  decode(input?: Uint8Array, options?: { stream?: boolean }): string;
}

/** Decodes a byte stream (fetch body) into text chunks. Requires a global `TextDecoder` (Hermes ≥ RN 0.74). */
export async function* decodeStream(body: ByteStream): AsyncGenerator<string> {
  const Decoder = (globalThis as { TextDecoder?: new () => TextDecoderLike }).TextDecoder;
  if (!Decoder) throw new Error('TextDecoder is not available in this runtime');
  const reader = body.getReader();
  const decoder = new Decoder();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}
