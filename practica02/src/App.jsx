import { useEffect, useState } from 'react'
import './App.css'

// Dirección base de la API y cantidad de Pokémon solicitados por página.
const POKEMON_API = 'https://pokeapi.co/api/v2/pokemon'
const PAGE_SIZE = 20

// Obtiene una página de Pokémon y carga sus datos individuales.
async function getPokemonPage(offset, signal) {
  // Solicita el listado usando limit y offset para controlar la paginación.
  const response = await fetch(
    `${POKEMON_API}?limit=${PAGE_SIZE}&offset=${offset}`,
    { signal },
  )

  // Verifica que la API haya devuelto una respuesta exitosa.
  if (!response.ok) {
    throw new Error('No se pudo obtener la lista de Pokémon.')
  }

  const data = await response.json()
  // Descarga al mismo tiempo los detalles de todos los Pokémon de la página.
  const pokemon = await Promise.all(
    data.results.map(async (item) => {
      const detailResponse = await fetch(item.url, { signal })

      // Verifica que los detalles de este Pokémon estén disponibles.
      if (!detailResponse.ok) {
        throw new Error(`No se pudo obtener los datos de ${item.name}.`)
      }

      const detail = await detailResponse.json()
      // Construye un objeto con los datos usados por la interfaz.
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
  // Estados que almacenan datos, paginación, búsqueda y estado visual.
  const [pokemon, setPokemon] = useState([])
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Ejecuta la carga cuando cambia la página mediante offset.
  useEffect(() => {
    // Permite cancelar una petición pendiente.
    const controller = new AbortController()

    async function loadPokemon() {
      setLoading(true)
      setError('')

      try {
        const nextPokemon = await getPokemonPage(offset, controller.signal)
        // Reemplaza la lista en la primera carga y agrega páginas posteriores.
        setPokemon((current) =>
          offset === 0 ? nextPokemon : [...current, ...nextPokemon],
        )
      } catch (requestError) {
        // Ignora el error generado al cancelar una petición deliberadamente.
        if (requestError.name !== 'AbortError') {
          setError(requestError.message)
        }
      } finally {
        // Solo cambia loading si la petición no fue cancelada.
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadPokemon()
    // Cancela la petición antes de ejecutar el efecto nuevamente.
    return () => controller.abort()
  }, [offset])

  // Filtra por nombre sin distinguir mayúsculas de minúsculas.
  const filteredPokemon = pokemon.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <main className="pokedex">
      <header className="pokedex-header">
        <p className="eyebrow">Pokémon API</p>
        <h1>Pokédex</h1>
        <p className="subtitle">Explora los Pokémon de la primera región</p>

        {/* Campo controlado: React almacena en search el texto escrito. */}
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

      {/* Muestra un mensaje de error si falla la petición. */}
      {error && <p className="status error" role="alert">{error}</p>}

      {/* Indica que están cargándose los primeros Pokémon. */}
      {pokemon.length === 0 && loading && (
        <p className="status">Cargando Pokémon...</p>
      )}

      {/* Genera una tarjeta por cada Pokémon filtrado. */}
      {filteredPokemon.length > 0 && (
        <section className="pokemon-grid" aria-label="Lista de Pokémon">
          {filteredPokemon.map((item) => (
            <article className="pokemon-card" key={item.id}>
              <span className="pokemon-number">#{String(item.id).padStart(3, '0')}</span>
              {/* Muestra un signo de pregunta si no hay imagen disponible. */}
              {item.image ? (
                <img src={item.image} alt={item.name} loading="lazy" />
              ) : (
                <div className="image-placeholder" aria-hidden="true">?</div>
              )}
              <h2>{item.name}</h2>
              {/* Genera una etiqueta visual para cada tipo del Pokémon. */}
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

      {/* Se muestra cuando la búsqueda no encuentra coincidencias. */}
      {!loading && search && filteredPokemon.length === 0 && (
        <p className="status">No se encontraron Pokémon con ese nombre.</p>
      )}

      {/* Oculta el botón al buscar y evita cargar varias páginas a la vez. */}
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
