export const cursor = fct => {
  const csr = fct()
  return csr && csr.count && csr.count() > 0 ? csr : null
}
