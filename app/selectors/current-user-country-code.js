export default state => {
  if (!state) return ''
  if (!state.authorization) return ''

  return state.authorization.country_code
}
