import { useEffect, useState } from 'react'
import './App.css'

const POKEMON_API = 'https://pokeapi.co/api/v2/pokemon'
const PAGE_SIZE = 20

async function getPokemonPage(offset, signal) {
  const response = await fetch(
    `${POKEMON_API}?limit=${PAGE_SIZE}&offset=${offset}`,
    { signal },
  )

  if (!response.ok) {
    throw new Error('No se pudo obtener la lista de Pokémon.')
  }

  const data = await response.json()
  const pokemon = await Promise.all(
    data.results.map(async (item) => {
      const detailResponse = await fetch(item.url, { signal })

      if (!detailResponse.ok) {
        throw new Error(`No se pudo obtener los datos de ${item.name}.`)
      }

      const detail = await detailResponse.json()
      return {
        id: detail.id,
        name: detail.name,
        image:
          detail.sprites.other['official-artwork'].front_default ??
          detail.sprites.front_default,
        types: detail.types.map((item) => item.type.name),
      }
    }),
  )

  return pokemon
}

function App() {
  const [pokemon, setPokemon] = useState([])
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadPokemon() {
      setLoading(true)
      setError('')

      try {
        const nextPokemon = await getPokemonPage(offset, controller.signal)
        setPokemon((current) =>
          offset === 0 ? nextPokemon : [...current, ...nextPokemon],
        )
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadPokemon()
    return () => controller.abort()
  }, [offset])

  const filteredPokemon = pokemon.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <main className="pokedex">
      <header className="pokedex-header">
        <p className="eyebrow">Pokémon API</p>
        <h1>Pokédex</h1>
        <p className="subtitle">Explora los Pokémon de la primera región</p>

        <label className="search-box">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Buscar Pokémon..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </header>

      {error && <p className="status error" role="alert">{error}</p>}

      {pokemon.length === 0 && loading && (
        <p className="status">Cargando Pokémon...</p>
      )}

      {filteredPokemon.length > 0 && (
        <section className="pokemon-grid" aria-label="Lista de Pokémon">
          {filteredPokemon.map((item) => (
            <article className="pokemon-card" key={item.id}>
              <span className="pokemon-number">#{String(item.id).padStart(3, '0')}</span>
              {item.image ? (
                <img src={item.image} alt={item.name} loading="lazy" />
              ) : (
                <div className="image-placeholder" aria-hidden="true">?</div>
              )}
              <h2>{item.name}</h2>
              <div className="types">
                {item.types.map((type) => (
                  <span className={`type type-${type}`} key={type}>
                    {type}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}

      {!loading && search && filteredPokemon.length === 0 && (
        <p className="status">No se encontraron Pokémon con ese nombre.</p>
      )}

      {!search && (
        <button
          type="button"
          className="load-more"
          onClick={() => setOffset((current) => current + PAGE_SIZE)}
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Cargar más'}
        </button>
      )}
    </main>
  )
}

export default App
