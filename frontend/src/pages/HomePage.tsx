import HeroSection from '@/components/shadcn-studio/blocks/hero-section-01/hero-section-01'
import Header from '@/components/shadcn-studio/blocks/hero-section-01/header'
import Gallery from '@/components/shadcn-studio/blocks/gallery-component-01/gallery-component-01'
import type { NavigationSection } from '@/components/shadcn-studio/blocks/hero-section-01/header'

const navigationData: NavigationSection[] = [
  {
    title: 'Home',
    href: '#'
  },
  {
    title: 'Products',
    href: '#'
  },
  {
    title: 'About Us',
    href: '#'
  },
  {
    title: 'Contact Us',
    href: '#'
  }
]
const gallerySections = [
  {
    images: [
      {
        src: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/gallery/image-10.png',
        alt: 'Coastal cliffs and ocean view'
      }
    ]
  },
  {
    type: 'grid',
    images: [
      {
        src: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/gallery/image-9.png',
        alt: 'Silhouettes on beach'
      },
      {
        src: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/gallery/image-8.png',
        alt: 'Snowy mountain peaks'
      },
      {
        src: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/gallery/image-7.png',
        alt: 'Rolling green hills'
      },
      {
        src: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/gallery/image-6.png',
        alt: 'Sunset landscape'
      }
    ]
  },
  {
    type: 'grid',
    images: [
      {
        src: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/gallery/image-4.png',
        alt: 'Silhouettes on beach'
      },
      {
        src: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/gallery/image-3.png',
        alt: 'Snowy mountain peaks'
      },
      {
        src: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/gallery/image-2.png',
        alt: 'Rolling green hills'
      },
      {
        src: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/gallery/image-1.png',
        alt: 'Sunset landscape'
      }
    ]
  },
  {
    images: [
      {
        src: 'https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/gallery/image-5.png',
        alt: 'Coastal cliffs and ocean view'
      }
    ]
  }
]


const HomePage = () => {

  return (
    <div className='relative'>
      {/* Header Section */}
      <Header navigationData={navigationData}  />

      {/* Main Content */}
      <main className='flex flex-col'>
        <HeroSection />
        <Gallery sections={gallerySections} />
      </main>
    </div>
  )
}

export default HomePage


