export const ok = (data: unknown, status = 200) =>
  Response.json({ success: true, data }, { status })

export const created = (data: unknown) =>
  Response.json({ success: true, data }, { status: 201 })

export const noContent = () =>
  new Response(null, { status: 204 })

export const err = (message: string, status = 400) =>
  Response.json({ success: false, error: message }, { status })