import { dir } from 'console';
import React from 'react';
import ContentLoader from 'react-content-loader';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ThreeDots } from '../MyLoader';
import { TouchableOrbitControls } from './utils';

// const OrbitControls = oc(THREE);

type MeshViewerProps = {
  className?: string;
  url?: string;
  gltf?: string;
  style?: React.CSSProperties;
  onError?: () => void;
};

export class MeshViewer extends React.Component<
  MeshViewerProps,
  { isLoading: boolean }
> {
  private threeMountRef = React.createRef<HTMLDivElement>();

  private gltfLoader: GLTFLoader = new GLTFLoader();

  private renderer?: THREE.WebGLRenderer;

  private camera?: THREE.OrthographicCamera;

  private gltfScene?: THREE.Object3D;

  private controls?: any;

  private windowResizeListener?: any;

  private lights: THREE.Light[] = [];

  private scene?: THREE.Scene;

  constructor(props: MeshViewerProps) {
    super(props);
    this.state = { isLoading: true };
  }

  componentDidMount() {
    if (!this.threeMountRef.current) {
      return;
    }
    // === THREE.JS CODE START ===
    this.renderer = new THREE.WebGLRenderer({ antialias: true  });

    const width = this.threeMountRef.current.clientWidth;
    const height = this.threeMountRef.current.clientHeight;
    this.renderer.setSize(width, height, false);
    this.renderer.setClearColor(0);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.threeMountRef.current.appendChild(this.renderer.domElement);
    const self = this;
    this.windowResizeListener = () => self.handleWindowResize();
    window.addEventListener(`resize`, this.windowResizeListener);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      width / -20,
      width / 20,
      height / 20,
      height / -20,
      0.1,
      10000,
    );
    this.controls = new TouchableOrbitControls(
      this.camera,
      this.renderer.domElement,
    );
    this.controls.target.set(0, 0, 0);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.autorotate = true;

    this.resetCamera();

    const { renderer } = this;
    const { camera } = this;
    const { controls } = this;
    let meshURL = ``;

    if (this.props.gltf) {
      meshURL = this.props.gltf;
      this.controls.enableZoom = true;
      this.controls.enablePan = true;
      this.controls.autorotate = false;
    } else if (this.props.url) {
      meshURL = this.props.url;
    }

    this.gltfLoader.load(
      meshURL,
      gltf => {
        const gltfScene = gltf.scene;
        const bbox = new THREE.Box3().setFromObject(gltfScene);
        const c = new THREE.Vector3();
        bbox.getCenter(c);
        gltfScene.position.set(-c.x, -c.y, -c.z);
        this.gltfScene = gltfScene;
        this.scene!.add(gltfScene);

        let mixer: THREE.AnimationMixer | undefined;
        if (gltf.animations && gltf.animations.length > 0) {
          const clip = gltf.animations[0];
          mixer = new THREE.AnimationMixer(gltfScene);
          const action = mixer.clipAction(clip);
          action.play();
        }
        const clock = new THREE.Clock();

        const animate = () => {
          requestAnimationFrame(animate);
          if (mixer) {
            mixer.update(clock.getDelta());
          }
          controls.update();
          renderer.render(this.scene!, camera);
        };
        animate();
        this.handleWindowResize();
        this.resetCamera();
        this.setState({ isLoading: false });
      },
      undefined,
      error => {
        if (this.props.onError) {
          this.props.onError();
        }
        console.error(error);
      },
    );
    this.handleWindowResize();
  }

  componentWillUnmount() {
    window.removeEventListener(`resize`, this.windowResizeListener);
    if (this.threeMountRef && this.threeMountRef.current && this.renderer) {
      this.threeMountRef.current.removeChild(this.renderer.domElement);
    }
  }

  handleWindowResize() {
    if (
      !this.threeMountRef ||
      !this.threeMountRef.current ||
      !this.camera ||
      !this.renderer
    ) {
      return;
    }

    let defaultZoom = 0.035;
    if (this.gltfScene) {
      const box = new THREE.Box3().setFromObject(this.gltfScene);
      const size = box.getSize(new THREE.Vector3()).length();
      const center = box.getCenter(new THREE.Vector3());
      defaultZoom = 2.1 / size;
    }

    const width = this.threeMountRef.current.clientWidth;
    const height = this.threeMountRef.current.clientHeight;
    const zoom = defaultZoom * Math.min(width, height);

    this.camera.left = width / -zoom;
    this.camera.right = width / zoom;
    this.camera.top = height / zoom;
    this.camera.bottom = height / -zoom;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
  }

  resetCamera() {
    if (!this.camera || !this.controls || !this.gltfScene || !this.scene) {
      return;
    }

    const box = new THREE.Box3().setFromObject(this.gltfScene);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    this.camera.position.setFromSphericalCoords(
      size * 1.5,
      THREE.MathUtils.degToRad(45),
      -THREE.MathUtils.degToRad(0),
    );
    this.controls.autorotate = true;
    this.controls.update();

    for (let i = 0; i < this.lights.length; i += 1) {
      this.scene.remove(this.lights[i]);
    }
    this.lights = [];

    let dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight.position.setFromSphericalCoords(
      size * 2.0,
      THREE.MathUtils.degToRad(45),
      THREE.MathUtils.degToRad(90),
    );
    this.scene.add(dirLight);
    this.lights.push(dirLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight.position.setFromSphericalCoords(
      size * 2.0,
      THREE.MathUtils.degToRad(45),
      THREE.MathUtils.degToRad(-90),
    );
    this.scene.add(dirLight);
    this.lights.push(dirLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);
  }

  render() {
    return (
      <>
        <div
          ref={this.threeMountRef}
          style={{
            width: `100%`,
            height: `100%`,
            minHeight: `300px`,
            minWidth: 150,
            maxHeight: 300,
            position: 'relative',
            ...this.props.style,
          }}
          className={`three-orbit ${this.props.className || ''}`.trim()}
        >
          {this.state.isLoading && (
            <ContentLoader
              viewBox="0 0 212 200"
              height={200}
              width={212}
              backgroundColor="transparent"
              style={{
                width: '100%',
                margin: 'auto',
                position: 'absolute',
                zIndex: 99,
                top: 0,
                left: 0,
              }}
            >
              <circle cx="86" cy="100" r="8" />
              <circle cx="106" cy="100" r="8" />
              <circle cx="126" cy="100" r="8" />
            </ContentLoader>
          )}
        </div>
      </>
    );
  }
}
