import * as THREE from './module/three.module.js'; 

main(); // Memanggil fungsi utama

function main() {
    try {
        // --------------------
        // PART 1: INISIALISASI
        // --------------------

        const canvas = document.querySelector("#c"); // Mengambil elemen canvas
        const gl = new THREE.WebGLRenderer({
            canvas,
            antialias: true
        });

        const angleOfView = 55; 
        const aspectRatio = canvas.clientWidth / canvas.clientHeight;
        const nearPlane = 0.1;
        const farPlane = 100;
        const camera = new THREE.PerspectiveCamera(
            angleOfView,
            aspectRatio,
            nearPlane,
            farPlane
        );
        camera.position.set(0, 5, 25); 

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xe6e6fa); // Ubah warna latar belakang menjadi lavender

        // Menambahkan kabut dengan efek tebal di sekitar objek
        const fog = new THREE.Fog("lightpink", 10, 50); // Mengatur kabut lebih dekat
        scene.fog = fog; 

        // --------------------
        // GEOMETRI, MATERIAL, dan PARTIKEL
        // --------------------

        const textureLoader = new THREE.TextureLoader(); 

        // Membuat partikel kecil warna pink yang bergerak
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 1000; 
        const positions = new Float32Array(particleCount * 3); // 3 nilai (x, y, z) per partikel
        const speeds = new Float32Array(particleCount * 3); // Kecepatan partikel untuk gerak acak

        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 50; // Posisi acak
            speeds[i] = (Math.random() - 0.5) * 0.05; // Kecepatan acak
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            color: 0xff69b4, // Warna pink
            size: 0.5, // Ukuran partikel
            transparent: true,
            opacity: 0.8 // Tingkat transparansi
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial); 
        scene.add(particles); 

        // --------------------
        // MENAMBAHKAN TEKSTUR KE KUBUS DAN BOLA
        // --------------------

        // Memuat tekstur untuk kubus dan bola
        const cubeTexture = textureLoader.load('bushes.jpg'); // Ganti dengan jalur ke tekstur kubus
        const sphereTexture = textureLoader.load('sakura.jpg'); // Ganti dengan jalur ke tekstur bola

        // GEOMETRI DAN MATERIAL UNTUK KUBUS
        const cubeSize = 4;
        const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const cubeMaterial = new THREE.MeshStandardMaterial({ 
            map: cubeTexture, // Menambahkan tekstur pada kubus
        });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        scene.add(cube); // Tambah kubus ke scene

        // GEOMETRI DAN MATERIAL UNTUK BOLA
        const sphereRadius = 3;
        const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 16);
        const sphereMaterial = new THREE.MeshStandardMaterial({ 
            map: sphereTexture, // Menambahkan tekstur pada bola
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(-sphereRadius - 2, 5, 0); // Posisi bola
        scene.add(sphere); // Tambah bola ke scene

        // LANTAI
        const planeWidth = 100;
        const planeHeight = 100;
        const planeTexture = textureLoader.load('wood.jpg'); // Ganti dengan jalur ke tekstur lantai
        const planeMaterial = new THREE.MeshStandardMaterial({
            map: planeTexture,
            side: THREE.DoubleSide // Tampilan dua sisi
        });
        const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2; // Posisi lantai horizontal
        scene.add(plane); // Tambah lantai ke scene

        // --------------------
        // PART 3: ANIMASI DAN RENDER
        // --------------------

        const color = 0xffffff; 
        const intensity = 1; 
        const light = new THREE.DirectionalLight(color, intensity); 
        light.position.set(5, 30, 30); 
        scene.add(light); 

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Intensitas lebih terang
        scene.add(ambientLight);

        const orbitRadius = 10; // Radius untuk orbit kubus
        let angle = 0; // Sudut untuk pergerakan kubus

        function draw(time) {
            time *= 0.001; // Mengubah waktu menjadi detik

            if (resizeGLToDisplaySize(gl)) {
                const canvas = gl.domElement;
                camera.aspect = canvas.clientWidth / canvas.clientHeight;
                camera.updateProjectionMatrix();
            }

            // Animasikan partikel seperti kunang-kunang
            const positions = particles.geometry.attributes.position.array;
            const speeds = particles.geometry.attributes.speed.array;
            for (let i = 0; i < particleCount * 3; i += 3) {
                // Gerak acak
                positions[i] += speeds[i];
                positions[i + 1] += speeds[i + 1];
                positions[i + 2] += speeds[i + 2];

                // Bounce kembali ke area jika partikel keluar dari batas
                if (positions[i] > 25 || positions[i] < -25) speeds[i] *= -1;
                if (positions[i + 1] > 25 || positions[i + 1] < -25) speeds[i + 1] *= -1;
                if (positions[i + 2] > 25 || positions[i + 2] < -25) speeds[i + 2] *= -1;
            }

            particles.geometry.attributes.position.needsUpdate = true; // Update posisi partikel

            // Efek denyut sinar
            particlesMaterial.size = 0.5 + Math.sin(time * 5) * 0.3; // Berdenyut

            // Rotasi bola
            sphere.rotation.x += 0.01;
            sphere.rotation.y += 0.01;

            // Menghitung posisi kubus yang mengelilingi bola
            angle += 0.02; // Kecepatan orbit
            cube.position.x = -sphereRadius - 2 + orbitRadius * Math.cos(angle); // Posisi kubus
            cube.position.z = orbitRadius * Math.sin(angle); // Posisi kubus
            cube.position.y = sphere.position.y; // Menyelaraskan tinggi kubus dengan bola

            // Rotasi kubus
            cube.rotation.x += 0.02;
            cube.rotation.y += 0.02;

            // Efek kabut bergerak dan menambah efek di depan objek
            const fogMovement = Math.sin(time) * 10;
            scene.fog.near = 10 + fogMovement; 
            scene.fog.far = 50 + fogMovement; // Membuat kabut lebih dekat dengan objek

            light.position.x = 20 * Math.cos(time); 
            light.position.y = 20 * Math.sin(time); 
            gl.render(scene, camera); 
            requestAnimationFrame(draw);
        }

        requestAnimationFrame(draw);

        function resizeGLToDisplaySize(gl) {
            const canvas = gl.domElement;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            const needResize = canvas.width !== width || canvas.height !== height;
            if (needResize) {
                gl.setSize(width, height, false);
            }
            return needResize;
        }

    } catch (error) {
        console.error("Terjadi kesalahan:", error);
    }
}
