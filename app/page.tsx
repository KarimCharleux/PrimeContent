'use client';
import { useEffect } from 'react';

export default function Page() {
    useEffect(() => {
        // Fonction pour vérifier si l'appareil est mobile
        function isMobile() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent,
            );
        }

        // Fonction pour vérifier si un nombre est pair
        function evenNumber(num: number) {
            return num % 2 === 0;
        }

        // Variables globales
        let galleryImagesMargin = 10;
        let galleryImagesSpeed = 0.0018;
        let mainSliderRequestFrameAnimation: number | null = null;

        // Fonction pour redimensionner les images
        function resizeImageBox(image: HTMLImageElement, targetHeight: number, type: string) {
            const ratio = image.width / image.height;
            return targetHeight * ratio;
        }

        // Fonction pour préparer les images de la galerie
        async function prepareAllGalleryImages() {
            let rowsNumber = 5;

            if (isMobile() || window.innerWidth < window.innerHeight) {
                if (window.innerWidth < window.innerHeight) {
                    rowsNumber = 9;
                    galleryImagesMargin = 5;
                    galleryImagesSpeed = 0.0022;
                }
            }

            // Utiliser les images locales du dossier public/gallery
            const imageUrls = [];
            for (let i = 1; i <= 80; i++) {
                imageUrls.push(`/gallery/image${i}.jpg`);
            }

            const preloadedImages = await preloadImages(imageUrls);
            createRowsContainer(rowsNumber);
            createMainImagesGallery(preloadedImages as HTMLImageElement[], rowsNumber);
        }

        function preloadImages(imageUrls: string[]) {
            return Promise.all(
                imageUrls.map((url) => {
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        img.src = url;
                        img.onload = () => resolve(img);
                        img.onerror = reject;
                    });
                }),
            );
        }

        function createRowsContainer(rowsNumber: number) {
            const main_gallery_innercontainer = document.getElementById(
                'main_gallery_innercontainer',
            );
            if (!main_gallery_innercontainer) return;

            // On ajoute des rows supplémentaires
            for (let i = 0; i < rowsNumber; i++) {
                let newRows = document.createElement('div');
                newRows.setAttribute('class', 'main_gallery_images_row');
                newRows.style.height = `${window.innerHeight / rowsNumber}px`;
                main_gallery_innercontainer.appendChild(newRows);
            }
        }

        function createMainImagesGallery(allImages: HTMLImageElement[], rowsNumber: number) {
            const main_gallery_innercontainer = document.getElementById(
                'main_gallery_innercontainer',
            );
            if (!main_gallery_innercontainer || !main_gallery_innercontainer.children.length)
                return;

            // On calcule la nouvelle width des images
            let parentContainerHeight =
                main_gallery_innercontainer.children[0].getBoundingClientRect().height;
            for (let i = 0; i < allImages.length; i++) {
                let targetwidth = resizeImageBox(allImages[i], parentContainerHeight, 'photos');
                allImages[i].setAttribute('data-targetwidth', targetwidth.toString());
            }

            // On transforme le slider en canvas
            createCanvasForMainSlider(allImages, rowsNumber);

            // On démarre les sliders
            startMainSlider();

            // On transforme la galerie
            updateTransformations();

            // On ajuste l'overlay noir pour faire apparaître la galerie
            const main_gallery_container = document.getElementById('main_gallery_container');
            if (main_gallery_container) {
                main_gallery_container.style.opacity = '1';
            }
        }

        function updateTransformations() {
            const main_gallery_container = document.getElementById('main_gallery_container');
            if (!main_gallery_container) return;

            let rotateYAngle = 0;
            let rotateXAngle = 0;
            let rotateZAngle = 0;
            let scaleValue = 1;
            let translateX = 0;
            let translateY = 0;

            if (window.innerWidth <= 1400) {
                rotateYAngle = 343;
                rotateXAngle = 30;
                rotateZAngle = 5;
                scaleValue = 1.7;
                translateX = 3;
                translateY = 0;
            }

            if (window.innerWidth > 1400 && window.innerWidth < 2500) {
                rotateYAngle = 344;
                rotateXAngle = 25;
                rotateZAngle = 5;
                scaleValue = 2.1;
                translateX = 3;
                translateY = -5;
            }

            if (window.innerWidth >= 2300) {
                rotateYAngle = 345;
                rotateXAngle = 25;
                rotateZAngle = 5;
                scaleValue = 2.2;
                translateX = 5;
                translateY = -4;
            }

            // Apply dynamic transformations with adjusted scale and rotation angles
            main_gallery_container.style.transform = `
                rotateY(${rotateYAngle}deg) 
                rotateX(${rotateXAngle}deg) 
                rotateZ(${rotateZAngle}deg) 
                scale(${scaleValue})
                translate3d(${translateX}%, ${translateY}%, 0)
            `;
        }

        function createCanvasForMainSlider(allImages: HTMLImageElement[], rowsNumber: number) {
            // On crée et ajoute les canvas
            const main_gallery_images_row = document.querySelectorAll('.main_gallery_images_row');
            main_gallery_images_row.forEach((container, index) => {
                let newSliderCanvas = document.createElement('canvas');
                newSliderCanvas.setAttribute('class', 'main_gallery_slider_canvas');
                const newSliderCanvasCtx = newSliderCanvas.getContext('2d');
                (newSliderCanvas as any).ctx = newSliderCanvasCtx;
                newSliderCanvas.width = window.innerWidth;
                newSliderCanvas.height = container.getBoundingClientRect().height;
                newSliderCanvas.style.transform = 'translate3d(0%, 0px, 0px)';
                (newSliderCanvas as any).transX = 0;

                let secondSliderCanvas = document.createElement('canvas');
                secondSliderCanvas.setAttribute('class', 'main_gallery_slider_clone');
                const secondSliderCanvasCtx = secondSliderCanvas.getContext('2d');
                (secondSliderCanvas as any).ctx = secondSliderCanvasCtx;
                secondSliderCanvas.width = window.innerWidth;
                secondSliderCanvas.height = container.getBoundingClientRect().height;

                if (evenNumber(index)) {
                    secondSliderCanvas.style.transform = 'translate3d(100%, 0px, 0px)';
                    (secondSliderCanvas as any).transX = 100;
                } else {
                    secondSliderCanvas.style.transform = 'translate3d(-100%, 0px, 0px)';
                    (secondSliderCanvas as any).transX = -100;
                }

                container.appendChild(newSliderCanvas);
                container.appendChild(secondSliderCanvas);
            });

            // On structure les images et containers
            let currentTotalWidth = 0;
            let currentContainerIndex = 0;
            let structuredContainerArray = [];
            for (let i = 0; i < rowsNumber; i++) {
                let setup = { totalwidth: 0, images: [] };
                structuredContainerArray.push(setup);
            }

            for (let i = 0; i < allImages.length; i++) {
                let imageWidth = parseFloat(allImages[i].dataset.targetwidth as string);
                structuredContainerArray[currentContainerIndex].images.push(allImages[i] as never);
                currentTotalWidth += imageWidth;

                if (currentTotalWidth >= window.innerWidth) {
                    structuredContainerArray[currentContainerIndex].totalwidth = currentTotalWidth;
                    currentTotalWidth = 0;
                    currentContainerIndex++;
                }

                if (currentContainerIndex == rowsNumber) break;
            }

            // Redimensionner les canvas et dessiner les images
            structuredContainerArray.forEach((container, index) => {
                if (index >= main_gallery_images_row.length) return;

                let canvas = main_gallery_images_row[index].children[0];
                let canvasClone = main_gallery_images_row[index].children[1];

                (canvas as any).width = container.totalwidth + galleryImagesMargin;
                (canvasClone as any).width = container.totalwidth;

                let images = container.images;
                drawOnCanvas(canvas as HTMLCanvasElement, images);
                drawOnCanvas(canvasClone as HTMLCanvasElement, images);
            });

            function drawOnCanvas(canvas: HTMLCanvasElement, images: HTMLImageElement[]) {
                let positionsX = galleryImagesMargin;
                let positionsY = galleryImagesMargin;
                let imgHeight = canvas.height - galleryImagesMargin;
                let borderRadius = 7;

                images.forEach((img: HTMLImageElement) => {
                    let imgWidth =
                        parseFloat(img.dataset.targetwidth as string) - galleryImagesMargin;
                    drawRoundedImage(
                        (canvas as any).ctx,
                        img,
                        positionsX,
                        positionsY,
                        imgWidth,
                        imgHeight,
                        borderRadius,
                    );
                    positionsX += imgWidth + galleryImagesMargin;
                });
            }

            function drawRoundedImage(
                ctx: CanvasRenderingContext2D,
                img: HTMLImageElement,
                x: number,
                y: number,
                width: number,
                height: number,
                radius: number,
            ) {
                (ctx as any).imageSmoothingEnabled = true;
                (ctx as any).imageSmoothingQuality = 'high';

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
                ctx.clip();

                ctx.drawImage(img, x, y, width, height);
                ctx.restore();
            }
        }

        function startMainSlider() {
            mainSlidingAnimation();
        }

        function mainSlidingAnimation() {
            const main_gallery_images_row = document.querySelectorAll('.main_gallery_images_row');
            main_gallery_images_row.forEach((container, index) => {
                if (container.children.length < 2) return;

                let slider = container.children[0];
                let sliderClone = container.children[1];

                // On récupère la translation actuelle
                let sliderTransX = (slider as any).transX;
                let sliderCloneTransX = (sliderClone as any).transX;

                // On update la translation
                let newTransX = sliderTransX;
                let newCloneTransX = sliderCloneTransX;

                if (evenNumber(index)) {
                    newTransX -= galleryImagesSpeed;
                    newCloneTransX -= galleryImagesSpeed;

                    if (newTransX <= -100) newTransX = 100;
                    if (newCloneTransX <= -100) newCloneTransX = 100;
                } else {
                    newTransX += galleryImagesSpeed;
                    newCloneTransX += galleryImagesSpeed;

                    if (newTransX >= 100) newTransX = -100;
                    if (newCloneTransX >= 100) newCloneTransX = -100;
                }

                // On update les sliders
                (slider as any).style.transform = `translate3d(${newTransX}%, 0px, 0px)`;
                (sliderClone as any).style.transform = `translate3d(${newCloneTransX}%, 0px, 0px)`;

                // On sauvegarde la nouvelle translation
                (slider as any).transX = newTransX;
                (sliderClone as any).transX = newCloneTransX;
            });

            mainSliderRequestFrameAnimation = requestAnimationFrame(mainSlidingAnimation);
        }

        // Initialiser la galerie après le chargement de la page
        prepareAllGalleryImages();

        // Nettoyage lors du démontage du composant
        return () => {
            if (mainSliderRequestFrameAnimation) {
                cancelAnimationFrame(mainSliderRequestFrameAnimation);
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-black text-white" data-oid="4na9626">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-black/80 backdrop-blur-sm" data-oid="eop1oye">
                <div className="max-w-7xl mx-auto px-4 py-4" data-oid="5chibow">
                    <div className="flex justify-between items-center" data-oid="l5ait_7">
                        <div className="text-2xl font-bold" data-oid="dy4hoda">
                            PrimeContent.
                        </div>
                        <div className="hidden md:flex space-x-8" data-oid="7r32nqe">
                            <a
                                href="/photos"
                                className="hover:text-purple-400 transition"
                                data-oid="ivi-5mp"
                            >
                                Photos
                            </a>
                            <a
                                href="/videos"
                                className="hover:text-purple-400 transition"
                                data-oid="6c76u:5"
                            >
                                Vidéos
                            </a>
                            <a
                                href="/branding"
                                className="hover:text-purple-400 transition"
                                data-oid="3q08hoe"
                            >
                                Événements
                            </a>
                            <a
                                href="/digital"
                                className="hover:text-purple-400 transition"
                                data-oid="_1dl2bu"
                            >
                                Mariage
                            </a>
                            <a
                                href="/contact"
                                className="hover:text-purple-400 transition"
                                data-oid="2n33g5."
                            >
                                Contact
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="top_gallery_navigation_container">
                <div id="main_gallery_container">
                    <div id="main_gallery_innercontainer"></div>
                </div>
                <div id="main_gallery_overlay"></div>
                <div id="main_gallery_overlay_bis"></div>
                <div id="main_navigation_container">
                    <h1
                        className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl"
                        data-oid="m92otuc"
                    >
                        OÙ LA CRÉATIVITÉ RENCONTRE LA STRATÉGIE
                    </h1>
                    <p
                        className="text-lg md:text-xl max-w-2xl mb-8 text-gray-300"
                        data-oid="j89re-5"
                    >
                        Chaque image devient une œuvre d'art. Nos vidéos, photos et créations
                        graphiques racontent des histoires qui valorisent votre entreprise.
                    </p>
                    <button
                        className="px-8 py-4 hover:[#000000] rounded-full transition transform hover:scale-105 flex items-center space-x-2 bg-[#FFFFFF] text-[#00000000] border-solid"
                        data-oid=":j6xg9c"
                    >
                        <span data-oid="o5rn-04" className="bg-[#00000000] text-[#000000]">
                            Contactez-nous
                        </span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 bg-[rgba(0,_0,_0,_0)]"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            data-oid="uyow-mz"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                                clipRule="evenodd"
                                data-oid="ogf_otj"
                                className="bg-[#00000000] text-[#000000]"
                            />
                        </svg>
                    </button>
                </div>
            </section>

            {/* Services Section */}
            <div className="max-w-7xl mx-auto px-4 py-24" data-oid="aewvgfq">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-oid="qufrvtt">
                    <div
                        className="group p-8 rounded-2xl bg-gray-900/50 hover:bg-purple-900/20 transition"
                        data-oid="qz0:ghk"
                    >
                        <div
                            className="w-12 h-12 bg-purple-600 rounded-lg mb-6 flex items-center justify-center"
                            data-oid="sb4k5u8"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                data-oid="lp8gwxz"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    data-oid="me-awjg"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-4" data-oid="dfx6gop">
                            Production Vidéo
                        </h3>
                        <p className="text-gray-400" data-oid="xmja38s">
                            Création de contenu vidéo professionnel pour tous vos besoins marketing
                            et communication.
                        </p>
                    </div>

                    <div
                        className="group p-8 rounded-2xl bg-gray-900/50 hover:bg-purple-900/20 transition"
                        data-oid="h-7bykt"
                    >
                        <div
                            className="w-12 h-12 bg-purple-600 rounded-lg mb-6 flex items-center justify-center"
                            data-oid="065axpj"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                data-oid="u8lg3x9"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                    data-oid="hr5p-dc"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-4" data-oid="1-dww3v">
                            Photographie
                        </h3>
                        <p className="text-gray-400" data-oid="z-_f4h2">
                            Photos professionnelles pour vos événements, produits et portraits
                            d'entreprise.
                        </p>
                    </div>

                    <div
                        className="group p-8 rounded-2xl bg-gray-900/50 hover:bg-purple-900/20 transition"
                        data-oid="r:eaolw"
                    >
                        <div
                            className="w-12 h-12 bg-purple-600 rounded-lg mb-6 flex items-center justify-center"
                            data-oid="1kfnthw"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                data-oid="5_7wm58"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    data-oid="a2_-dul"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-4" data-oid="psqnotj">
                            Design Digital
                        </h3>
                        <p className="text-gray-400" data-oid="o5_a:do">
                            Création d'interfaces web et mobile, branding et gestion des réseaux
                            sociaux.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
