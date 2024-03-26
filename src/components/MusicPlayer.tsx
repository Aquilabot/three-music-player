import { createSignal, onMount } from "solid-js";
import * as THREE from "three";
import SpotifyWebApi from "spotify-web-api-js";

type MusicPlayerProps = {
  accessToken: string;
};

const MusicPlayer = (props: MusicPlayerProps) => {
  const [trackId, setTrackId] = createSignal("");
  const [audioFeatures, setAudioFeatures] = createSignal(null);
  let canvasRef: HTMLCanvasElement | undefined;

  const spotifyApi = new SpotifyWebApi();

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
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Creates the plane geometry
    const planeGeometry = new THREE.PlaneGeometry(10, 10);

    // Creates the frosted glass material
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

    // Create the drawing and apply the material
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 0, 10);
    scene.add(light);

    // Get the audio analysis of the track
    spotifyApi.getAudioFeaturesForTrack(trackId()).then((data: any) => {
      setAudioFeatures(data);
    });

    // Render the scene
    const animate = () => {
      if (canvasRef) {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      }
    };
    animate();
  });

  return <canvas ref={canvasRef} />;
};

export default MusicPlayer;
