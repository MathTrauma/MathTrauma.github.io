import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createP5Sine } from './p5_sine.js';

export class VoxelWorld {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.clock = new THREE.Clock();
        this.controls = null;
        this.animationId = null;

        this.interactiveObjects = [];
        this.projectTexture = null;

        this.onWindowResize = this.onWindowResize.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onClick = this.onClick.bind(this);

        this.init();
    }

    /* ---------------------------------- */
    /* dynamic raycast targets             */
    /* ---------------------------------- */
    get sceneGroups() {
        return this.interactiveObjects.map(obj => obj.mesh);
    }

    /* ---------------------------------- */
    /* init                                */
    /* ---------------------------------- */
    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.scene.background = new THREE.Color('#111827');
        this.scene.fog = new THREE.Fog('#a1b8b7', 10, 50);

        this.camera.position.set(0, 5, 15);
        this.camera.lookAt(0, 0, 0);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 30;
        this.controls.maxPolarAngle = Math.PI / 2;

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(2048, 2048);
        this.scene.add(dirLight);

        this.scene.add(new THREE.GridHelper(50, 50, 0x444444, 0x222222));

        this.createObjects();
        this.createProject();

        window.addEventListener('resize', this.onWindowResize);
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
        this.renderer.domElement.addEventListener('click', this.onClick);

        this.animate();
    }

    /* ---------------------------------- */
    /* voxel icons                         */
    /* ---------------------------------- */
    createObjects() {
        const configs = [
            { id: 'problems', type: 'problem', position: [4, 0, -3], url: 'https://www.mathtrauma.com/Problem-Bank/' },
            { id: 'tools', type: 'tool', position: [0, 3, 2], url: 'https://www.mathtrauma.com/CompositeFunction/' },
            { id: 'math', type: 'math', position: [-4, 1, 4], url: 'https://www.youtube.com/watch?v=fvxhiLpHVNU' },
            { id: 'computer', type: 'computer', position: [-1.5, 0, 5], url: 'https://github.com/' },
            { id: 'game', type: 'game', position: [1.5, 0, 3], url: 'https://www.mathtrauma.com/PrimeShooter/' },
            { id: 'youtube', type: 'youtube', position: [6, 0, -1], url: 'https://www.youtube.com/@mathtrauma/videos' },
        ];

        configs.forEach(config => {
            const group = this.generateVoxelMesh(config.type);
            group.position.set(...config.position);
            group.userData.isRoot = true;

            this.interactiveObjects.push({ mesh: group, config });
            this.scene.add(group);
        });
    }

    /* ---------------------------------- */
    /* p5 project cube                     */
    /* ---------------------------------- */
    createProject() {
        const config = {
            id: 'board',
            type: 'board',
            position: [-4, 2, -2],
            url: 'https://www.mathtrauma.com/start'
        };

        const p5Container = document.createElement('div');
        p5Container.style.display = 'none';
        document.body.appendChild(p5Container);

        createP5Sine(p5Container, canvas => {
            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;

            this.projectTexture = texture;

            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(2, 2, 2),
                new THREE.MeshBasicMaterial({ map: texture })
            );

            mesh.position.set(...config.position);
            mesh.userData.isRoot = true;

            this.interactiveObjects.push({ mesh, config });
            this.scene.add(mesh);
        });
    }

    /* ---------------------------------- */
    /* voxel helpers                       */
    /* ---------------------------------- */
    createVoxel(x, y, z, color, size = 0.25) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(size, size, size),
            new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 })
        );
        mesh.position.set(x * size, y * size, z * size);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    generateVoxelMesh(type) {
        const group = new THREE.Group();
        let voxels = [];
        let baseColor = '#ffffff';

        if (type === 'problem') {
            baseColor = '#eb82f6';
            for (let y = -2; y <= 2; y++) voxels.push({ x: 0, y: y + 5, z: -2 });
            for (let x = -2; x <= 2; x++) voxels.push({ x, y: 5, z: -2 });
        }

        if (type === 'math') {
            baseColor = '#3b82f6';
            for (let y = -2; y <= 2; y++) voxels.push({ x: 0, y: y + 3, z: 0 });
            for (let x = -2; x <= 2; x++) voxels.push({ x, y: 3, z: 0 });
        }

        if (type === 'game') {
            baseColor = '#22c55e';
            const invader = [
                '  X   X  ',
                '   X X   ',
                '  XXXXX  ',
                ' XX X XX ',
                'XXXXXXXXX',
                'X XXXXX X',
                'X X   X X',
                '  XX XX  '
            ];

            invader.forEach((row, y) => {
                [...row].forEach((c, x) => {
                    if (c === 'X') voxels.push({ x: x - 4, y, z: 0 });
                });
            });
        }

        voxels.forEach(v => {
            group.add(this.createVoxel(v.x, v.y, v.z, v.color || baseColor));
        });

        return group;
    }

    /* ---------------------------------- */
    /* interaction                         */
    /* ---------------------------------- */
    findRoot(object) {
        while (object && !object.userData.isRoot) {
            object = object.parent;
        }
        return object;
    }

    onClick() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hits = this.raycaster.intersectObjects(this.sceneGroups, true);

        if (!hits.length) return;

        const root = this.findRoot(hits[0].object);
        const found = this.interactiveObjects.find(o => o.mesh === root);
        if (found) window.open(found.config.url, '_self');
    }

    onMouseMove(e) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /* ---------------------------------- */
    /* loop                                */
    /* ---------------------------------- */
    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));

        const time = this.clock.getElapsedTime();
        this.controls.update();

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hits = this.raycaster.intersectObjects(this.sceneGroups, true);
        this.container.style.cursor = hits.length ? 'pointer' : 'default';

        this.interactiveObjects.forEach((obj, i) => {
            obj.mesh.position.y =
                obj.config.position[1] + Math.sin(time * 2 + i) * 0.2;
            obj.mesh.rotation.y = Math.sin(time * 0.5 + i) * 0.3;

            const hovered =
                hits.length &&
                this.findRoot(hits[0].object) === obj.mesh;

            obj.mesh.scale.lerp(
                new THREE.Vector3(hovered ? 1.2 : 1, hovered ? 1.2 : 1, hovered ? 1.2 : 1),
                0.1
            );
        });

        if (this.projectTexture) {
            this.projectTexture.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }
}
