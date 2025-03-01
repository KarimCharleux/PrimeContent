'use client';
import { useEffect, useRef } from 'react';

export default function Gallery() {
    // Référence pour le conteneur de la galerie
    const galleryContainerRef = useRef<HTMLDivElement>(null);
    
    // Variable pour stocker l'animation
    let mainSliderRequestFrameAnimation: number | null = null;

    useEffect(() => {
        // Variables globales
        let galleryImagesMargin = 10;
        let galleryImagesSpeed = 0.0018;

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

        // Fonction pour redimensionner les images
        function resizeImageBox(image: HTMLImageElement, targetHeight: number) {
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

            try {
                // Récupérer dynamiquement les images du dossier gallery
                const response = await fetch('/api/gallery-images');
                const data = await response.json();
                const imageUrls = data.images.map((image: string) => `/gallery/${image}`);
                
                const preloadedImages = await preloadImages(imageUrls);
                createRowsContainer(rowsNumber);
                createMainImagesGallery(preloadedImages as HTMLImageElement[], rowsNumber);
            } catch (error) {
                console.error('Erreur lors du chargement des images:', error);
            }
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
            const galleryInner = document.querySelector('.gallery-inner');
            if (!galleryInner) return;

            // On ajoute des rows supplémentaires
            for (let i = 0; i < rowsNumber; i++) {
                let newRows = document.createElement('div');
                newRows.setAttribute('class', 'gallery-row');
                newRows.style.height = `${window.innerHeight / rowsNumber}px`;
                galleryInner.appendChild(newRows);
            }
        }

        function createMainImagesGallery(allImages: HTMLImageElement[], rowsNumber: number) {
            const galleryInner = document.querySelector('.gallery-inner');
            if (!galleryInner || !galleryInner.children.length)
                return;

            // On calcule la nouvelle width des images
            let parentContainerHeight =
                galleryInner.children[0].getBoundingClientRect().height;
            for (let i = 0; i < allImages.length; i++) {
                let targetwidth = resizeImageBox(allImages[i], parentContainerHeight);
                allImages[i].setAttribute('data-targetwidth', targetwidth.toString());
            }

            // On transforme le slider en canvas
            createCanvasForMainSlider(allImages, rowsNumber);

            // On démarre les sliders
            startMainSlider();

            // On transforme la galerie
            updateTransformations();

            // On ajuste l'overlay noir pour faire apparaître la galerie
            const galleryContainer = document.querySelector('.gallery-container');
            if (galleryContainer) {
                (galleryContainer as HTMLElement).style.opacity = '1';
            }
        }

        function updateTransformations() {
            const galleryContainer = document.querySelector('.gallery-container');
            if (!galleryContainer) return;

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
            (galleryContainer as HTMLElement).style.transform = `
                rotateY(${rotateYAngle}deg) 
                rotateX(${rotateXAngle}deg) 
                rotateZ(${rotateZAngle}deg) 
                scale(${scaleValue})
                translate3d(${translateX}%, ${translateY}%, 0)
            `;
        }

        function createCanvasForMainSlider(allImages: HTMLImageElement[], rowsNumber: number) {
            // On crée et ajoute les canvas
            const galleryRows = document.querySelectorAll('.gallery-row');
            galleryRows.forEach((container, index) => {
                let newSliderCanvas = document.createElement('canvas');
                newSliderCanvas.setAttribute('class', 'gallery-slider-canvas');
                const newSliderCanvasCtx = newSliderCanvas.getContext('2d');
                (newSliderCanvas as any).ctx = newSliderCanvasCtx;
                newSliderCanvas.width = window.innerWidth;
                newSliderCanvas.height = container.getBoundingClientRect().height;
                newSliderCanvas.style.transform = 'translate3d(0%, 0px, 0px)';
                (newSliderCanvas as any).transX = 0;

                let secondSliderCanvas = document.createElement('canvas');
                secondSliderCanvas.setAttribute('class', 'gallery-slider-clone');
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

            // Supprimer les rangées qui ne contiennent pas d'images
            const updatedGalleryRows = document.querySelectorAll('.gallery-row');
            updatedGalleryRows.forEach((container, index) => {
                if (index >= structuredContainerArray.length || structuredContainerArray[index].images.length === 0) {
                    container.remove();
                }
            });

            // Ajuster la hauteur des rangées restantes
            const remainingRows = document.querySelectorAll('.gallery-row');
            if (remainingRows.length > 0) {
                const newHeight = `${window.innerHeight / remainingRows.length}px`;
                remainingRows.forEach(row => {
                    (row as HTMLElement).style.height = newHeight;
                });
            }

            // Redimensionner les canvas et dessiner les images
            structuredContainerArray.forEach((container, index) => {
                if (container.images.length === 0) return;
                
                const finalGalleryRows = document.querySelectorAll('.gallery-row');
                if (index >= finalGalleryRows.length) return;

                let canvas = finalGalleryRows[index].children[0];
                let canvasClone = finalGalleryRows[index].children[1];

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
            const galleryRows = document.querySelectorAll('.gallery-row');
            galleryRows.forEach((container, index) => {
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
        <div className="gallery-hero-section">
            <div className="gallery-container" ref={galleryContainerRef}>
                <div className="gallery-inner"></div>
            </div>
            <div className="gallery-overlay-primary"></div>
            <div className="gallery-overlay-secondary"></div>
        </div>
    );
} 