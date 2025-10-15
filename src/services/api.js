export async function fetchMock(name){
  // simple dynamic import for mock data
  try{
    const module = await import(`../data/${name}.json`)
    return module.default
  }catch(e){
    console.error('mock fetch error', e)
    return null
  }
}
