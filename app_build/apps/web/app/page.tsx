import ExhibitSection from '@/components/ExhibitSection';
import PanExhibitSection from '@/components/PanExhibitSection';
import Footer from '@/components/Footer';
import ProgressBar from '@/components/ProgressBar';
import RelatedStories from '@/components/RelatedStories';
import { galleryData, accoutrementsData } from '@/lib/model/data';
import CollectionCarousel from '@/components/CollectionCarousel';
import ExhibitCarousel from '@/components/ExhibitCarousel';

export default function VirtualMuseumTour() {
  return (
    <main className="bg-neutral-950">
      {/* Progress Bar to visually let user know the scrolling progress */}
      <ProgressBar />

      {galleryData.map((exhibit, index) => (
        <ExhibitSection
          key={exhibit.id}
          index={index}
          title={exhibit.title}
          description={exhibit.description}
          detailText={exhibit.detailText}
          imageSrc={exhibit.imageSrc}
          isLast={index === galleryData.length - 1}
        />
      ))}

      <ExhibitCarousel
        title="Accoutrements & Details"
        subtitle="Explore the prescribed accessories worn with the 1899 Frock Coat."
        items={accoutrementsData}
      />

      {/* <CollectionCarousel /> */}

      {/* Optional Outro Banner */}
      {/* <div className="h-[50vh] flex items-center justify-center text-white">
        <p className="text-2xl text-gray-400">End of Exhibition</p>
      </div> */}


      <RelatedStories />

      {/* Footer */}
      <Footer />

      {/* Optional Intro Banner */}
      {/* <div className="h-screen flex items-center justify-center text-white">
        <h1 className="text-4xl tracking-widest uppercase">Scroll to Begin Tour</h1>
      </div> */}

     {/* The Map Loop */}
     {/* {galleryData.map((exhibit, index) => (
        <PanExhibitSection
          key={exhibit.id}
          index={index}
          title={exhibit.title}
          description={exhibit.description}
          imageSrc={exhibit.imageSrc}
        />
      ))} */}
    </main>
  );
}
