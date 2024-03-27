import { createSignal, onMount } from "solid-js";
import SpotifyWebApi from "spotify-web-api-js";
import ColorThief from "colorthief";
import "./MusicPlayer.css";

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
  const [audioRef, setAudioRef] = createSignal<HTMLAudioElement | null>(null);
  const [isSearchVisible, setSearchVisible] = createSignal(true);

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

    const audio = audioRef();
    if (audio) {
      audio.src = track.preview_url;
      await audio.play();
    }
  };

  const togglePlay = () => {
    const audio = audioRef();
    if (audio?.paused) {
      audio?.play();
    } else {
      audio?.pause();
    }
  };

  const handleSeek = (event: Event) => {
    const seekTime = (event.target as HTMLInputElement).value;
    const audio = audioRef();
    if (audio) {
      audio.currentTime = parseFloat(seekTime);
    }
  };

  const toggleRepeat = () => {
    const audio = audioRef();
    if (audio) {
      audio.loop = !audio.loop;
    }
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
        <div class="absolute inset-0 bg-white bg-opacity-20 backdrop-filter backdrop-blur-[137px]">
          <div class="grain-overlay"></div>
        </div>
        {selectedTrack() && (
          <div class="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
            <button onClick={togglePlay}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="w-6 h-6"
              >
                {audioRef()?.paused ? (
                  <path
                    fill-rule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 00-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 01-.189-.866c0-.298.059-.605.189-.866zm-4.34 7.964a.75.75 0 01-1.061-1.06 5.236 5.236 0 013.73-1.538 5.236 5.236 0 013.695 1.538.75.75 0 11-1.061 1.06 3.736 3.736 0 00-2.639-1.098 3.736 3.736 0 00-2.664 1.098z"
                    clip-rule="evenodd"
                  />
                ) : (
                  <path
                    fill-rule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z"
                    clip-rule="evenodd"
                  />
                )}
              </svg>
            </button>
            <input
              type="range"
              min="0"
              max={audioRef()?.duration || 0}
              step="0.01"
              value={audioRef()?.currentTime || 0}
              onInput={handleSeek}
              class="w-full mx-4"
            />
            <button onClick={toggleRepeat}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="w-6 h-6"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9zm1.5 0v9a.75.75 0 00.75.75h9a.75.75 0 00.75-.75v-9a.75.75 0 00-.75-.75h-9a.75.75 0 00-.75.75z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
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
        <div class="absolute bottom-0 inset-x-0 p-8 flex items-center">
          <div class="w-1/2">
            <h2 class="text-4xl font-bold mb-2">{selectedTrack()?.name}</h2>
            <p class="text-2xl">{selectedTrack()?.artists[0].name}</p>
          </div>
          <div class="w-1/2 flex justify-end">
            <img
              src={selectedTrack()?.album.images[0].url}
              alt={selectedTrack()?.name}
              class="w-48 h-48 object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
      <audio ref={setAudioRef} style={{ display: "none" }} />
    </div>
  );
};

export default MusicPlayer;
