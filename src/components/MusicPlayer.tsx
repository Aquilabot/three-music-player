import { createSignal, onMount } from "solid-js";
import * as THREE from "three";
import SpotifyWebApi from "spotify-web-api-js";
import ColorThief from "colorthief";

type MusicPlayerProps = {
  accessToken: string;
};
interface BackgroundGradient {
  style: string;
  keyframes: string;
}

const MusicPlayer = (props: MusicPlayerProps) => {
  const [search, setSearch] = createSignal("");
  const [tracks, setTracks] = createSignal<SpotifyApi.TrackObjectFull[]>([]);
  const [selectedTrack, setSelectedTrack] =
    createSignal<SpotifyApi.TrackObjectFull | null>(null);
  const [audioFeatures, setAudioFeatures] =
    createSignal<SpotifyApi.AudioFeaturesResponse | null>(null);
  const [isSearchVisible, setSearchVisible] = createSignal(true);
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

  const getBackgroundGradient = async (
    imageUrl: string,
  ): Promise<BackgroundGradient> => {
    const colorThief = new ColorThief();
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    return new Promise((resolve) => {
      img.addEventListener("load", () => {
        const palette = colorThief.getPalette(img, 4);
        const gradient = `linear-gradient(45deg, rgb(${palette[0].join(",")}), rgb(${palette[1].join(",")}), rgb(${palette[2].join(",")}), rgb(${palette[3].join(",")}))`;
        const keyframes = `@keyframes gradientAnimation {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }`;
        const style = `background: ${gradient}; background-size: 400% 400%; animation: gradientAnimation 15s ease infinite;`;
        resolve({ style, keyframes });
      });
    });
  };

  onMount(() => {
    spotifyApi.setAccessToken(props.accessToken);

    // Configure the Three.js scene
    const scene = new THREE.Scene();

    // Configure the camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 5;

    // Configures the renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Creates the plane geometry
    const planeGeometry = new THREE.PlaneGeometry(10, 10);

    // Creates the frosted glass material
    const glassMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      shininess: 30,
    });

    // Create the drawing and apply the material
    const plane = new THREE.Mesh(planeGeometry, glassMaterial);
    scene.add(plane);

    // Adds lighting to the scene
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 0, 10);
    scene.add(light);

    // Render the scene
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
    const { style, keyframes } = (await getBackgroundGradient(
      track.album.images[0].url,
    )) as BackgroundGradient;
    document.body.style.cssText = style;
    const styleElement = document.createElement("style");
    styleElement.innerHTML = keyframes;
    document.head.appendChild(styleElement);
  };

  return (
    <div class="flex h-screen">
      <div
        class={`w-1/5 p-4 overflow-y-auto ${isSearchVisible() ? "" : "hidden"}`}
      >
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
      <div class="w-4/5 relative">
        <button
          class="absolute top-4 left-4 p-2 bg-white rounded-md shadow-md text-gray-600 hover:text-gray-800 focus:outline-none"
          onClick={() => setSearchVisible(!isSearchVisible())}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <canvas ref={canvasRef} class="w-full h-full" />
        {selectedTrack() && (
          <div class="absolute bottom-4 left-4 text-white">
            <h2 class="text-2xl font-bold">{selectedTrack()!.name}</h2>
            <p class="text-lg">{selectedTrack()!.artists[0].name}</p>
            <img
              src={selectedTrack()!.album.images[0].url}
              alt={selectedTrack()!.name}
              class="w-24 h-24 mt-2 object-cover rounded-md"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicPlayer;
