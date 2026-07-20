import HeroSection from '@/components/shadcn-studio/blocks/hero-section-01/hero-section-01'
import Header from '@/components/layout/header'
import Gallery from '@/components/shadcn-studio/blocks/gallery-component-01/gallery-component-01'
import type { NavigationSection } from '@/components/layout/header'
import { Crown } from 'lucide-react'
import WorkshopCard from '@/components/WorkshopCard'
import {Button} from '@/components/ui/button'
import {Search, MapPin} from "lucide-react"
import {Input} from "@/components/ui/input"
import {Separator} from "@/components/ui/separator"
import Footer from "@/components/layout/footer"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const navigationData: NavigationSection[] = [
  {
    title: 'Tìm workshop',
    href: '/workshops'
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
  ,
  {
    title: 'Tạo workshop',
    href: '/createworkshop'
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

        <section id="priority" className="mx-auto max-w-360 px-5 pt-12">
          <div className="mb-4 flex items-center gap-2">
            <Crown className="text-primary" size={20} />
            <h2 className="font-display text-2xl font-700">Workshop được tài trợ</h2>
          </div>

          <Carousel
            opts={{
              align: "start",
            }}
            className="w-full "
          >
            <CarouselContent>
              {Array.from({ length: 5 }).map((_, index) => (
                <CarouselItem key={index} className="basis-full lg:basis-1/3">
                  <WorkshopCard />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>

         




          <div className="mb-4 flex items-center gap-2 mt-8">
            <h2 className="font-display text-2xl font-700">Khám phá tất cả workshop</h2>
          </div>
          <div>
            {/* Search bar */}
          <form
            // onSubmit={handleSearch}
            className="w-full flex flex-col gap-2 rounded-xl bg-background/95 p-3 shadow-2xl backdrop-blur sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Bạn muốn học gì hôm nay?"
                className="border-0 pl-9 shadow-none focus-visible:ring-0"
                // value={searchQuery}
                // onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Separator orientation="vertical" className="hidden h-8 self-center sm:block" />
            <div className="relative sm:w-48">
              <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Quận / Huyện"
                className="border-0 pl-9 shadow-none focus-visible:ring-0"
                // value={searchDistrict}
                // onChange={(e) => setSearchDistrict(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="shrink-0">
              Tìm Kiếm
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 mb-4">
            {["Làm Gốm", "Vẽ Tranh", "Làm Nến", "Cắm Hoa"].map((tag) => (
              <button
                key={tag}
                // onClick={() => navigate(`/search?q=${tag}`)}
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-sm text-foreground backdrop-blur transition-colors hover:bg-white/20"
              >
                {tag}
              </button>
            ))}
          </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <WorkshopCard />
            <WorkshopCard />
            <WorkshopCard />
          </div>
          </div>
        </section>


      </main>
      <Footer/>
    </div>
  )
}

export default HomePage


