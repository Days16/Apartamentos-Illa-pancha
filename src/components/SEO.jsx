import { useEffect } from 'react';

export default function SEO({ title, description }) {
    useEffect(() => {
        document.title = title ? `${title} | Illa Pancha` : 'Illa Pancha | Apartamentos Turísticos en Ribadeo';

        if (description) {
            let metaDescription = document.querySelector('meta[name="description"]');
            if (!metaDescription) {
                metaDescription = document.createElement('meta');
                metaDescription.name = 'description';
                document.head.appendChild(metaDescription);
            }
            metaDescription.setAttribute('content', description);
        }
    }, [title, description]);

    return null;
}
