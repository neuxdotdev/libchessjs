// test.mjs
import lib from './dist/bundle.js'

// Ambil konstruktor dari bundle
const { ChessComHttpClient, PlayerEndpoints } = lib

// Inisialisasi HTTP client
const http = new ChessComHttpClient({
  baseURL: 'https://api.chess.com/pub',
})

// Buat instance endpoint
const player = new PlayerEndpoints(http)

// Jalankan tes
try {
  const profile = await player.getPlayer('neuxdotdev')
  console.log('Profil:', profile.data)
} catch (err) {
  console.error('Gagal ambil profil:', err)
}
