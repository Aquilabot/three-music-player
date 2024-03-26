import { createSignal, onMount } from "solid-js";
import * as THREE from "three";
import SpotifyWebApi from "spotify-web-api-js";
import ColorThief from "colorthief";

type MusicPlayerProps = {
  accessToken: string;
};

const MusicPlayer = (props: MusicPlayerProps) => {
  const [search, setSearch] = createSignal("");
  const [tracks, setTracks] = createSignal<SpotifyApi.TrackObjectFull[]>([]);
  const [selectedTrack, setSelectedTrack] =
    createSignal<SpotifyApi.TrackObjectFull | null>(null);
  const [audioFeatures, setAudioFeatures] =
    createSignal<SpotifyApi.AudioFeaturesResponse | null>(null);
  let canvasRef: HTMLCanvasElement | undefined;

  const spotifyApi = new SpotifyWebApi();

  const searchTracks = async () => {
    const response = await spotifyApi.searchTracks(search());
    setTracks(response.tracks.items);
  };

  const getTrackAnalysis = async (trackId: string) => {
    const data = await spotifyApi.getAudioFeaturesForTrack(trackId);
    setAudioFeatures(data);
  };

  const getBackgroundGradient = async (imageUrl: string) => {
    const colorThief = new ColorThief();
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    return new Promise((resolve) => {
      img.addEventListener("load", () => {
        const palette = colorThief.getPalette(img, 2);
        const gradient = `linear-gradient(45deg, rgb(${palette[0].join(",")}), rgb(${palette[1].join(",")}))`;
        resolve(gradient);
      });
    });
  };

  onMount(() => {
    spotifyApi.setAccessToken(props.accessToken);

    // Configura la escena de Three.js
    const scene = new THREE.Scene();

    // Configura la cámara
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 5;

    // Configura el renderizador
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Crea la geometría del plano
    const planeGeometry = new THREE.PlaneGeometry(10, 10);

    // Crea el material de vidrio esmerilado
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      roughness: 0.5,
      metalness: 0.1,
    });

    // Crea el plano y aplica el material
    const plane = new THREE.Mesh(planeGeometry, glassMaterial);
    scene.add(plane);

    // Agrega iluminación a la escena
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 0, 10);
    scene.add(light);

    // Renderiza la escena
    const animate = () => {
      if (canvasRef) {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      }
    };
    animate();
  });

  const handleSearch = (event: Event) => {
    event.preventDefault();
    searchTracks();
  };

  const handleTrackClick = async (track: SpotifyApi.TrackObjectFull) => {
    setSelectedTrack(track);
    await getTrackAnalysis(track.id);
    const gradient = await getBackgroundGradient(track.album.images[0].url);
    document.body.style.background = gradient as string;
  };

  return (
    <div class="flex h-screen">
      <div class="w-1/3 p-4 overflow-y-auto">
        <form onSubmit={handleSearch} class="mb-4">
          <input
            type="text"
            value={search()}
            onInput={(event) => setSearch(event.currentTarget.value)}
            placeholder="Search tracks..."
            class="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            class="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
        </form>
        <ul class="space-y-2">
          {tracks().map((track) => (
            <li
              onClick={() => handleTrackClick(track)}
              class="cursor-pointer px-4 py-2 rounded-md hover:bg-gray-100"
            >
              {track.name} - {track.artists[0].name}
            </li>
          ))}
        </ul>
      </div>
      <div class="w-2/3 relative">
        <canvas ref={canvasRef} class="w-full h-full" />
        {selectedTrack() && (
          <div class="absolute bottom-4 left-4 text-white">
            <h2 class="text-2xl font-bold">
              {(selectedTrack() as SpotifyApi.TrackObjectFull).name}
            </h2>
            <p class="text-lg">
              {(selectedTrack() as SpotifyApi.TrackObjectFull).artists[0].name}
            </p>
            <img
              src={
                (selectedTrack() as SpotifyApi.TrackObjectFull).album.images[0]
                  .url
              }
              alt={(selectedTrack() as SpotifyApi.TrackObjectFull).name}
              class="w-24 h-24 mt-2 object-cover rounded-md"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicPlayer;
