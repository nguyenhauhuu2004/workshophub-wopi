import { Button } from '@/components/ui/button'

import {
  Search,
  MapPin,
  Sparkles,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useNavigate } from "react-router";
import {useState} from "react";


const HeroSection = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchDistrict, setSearchDistrict] = useState("");

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate(`/search?q=${searchQuery}&district=${searchDistrict}`);
  };
  return (
    <section className="relative overflow-hidden flex container">
     <div className="relative flex-2 mx-auto max-w-7xl px-4 py-24 md:px-6 md:py-36 lg:py-44">
        <div className="max-w-2xl">
          <Badge className="mb-4 bg-primary/20 text-primary-foreground backdrop-blur-sm border-primary/30">
            <Sparkles className="mr-1 size-3" />
            300+ Workshop đang mở đặt chỗ
          </Badge>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-foreground drop-shadow-lg md:text-5xl lg:text-6xl">
            Khám Phá Nghệ Thuật.{" "}
            <br/>
            <span className="text-foreground">Sống Trọn Vẹn Hơn.</span>
          </h1>
          <p className="mb-8 text-lg text-foreground/90 leading-relaxed md:text-xl">
            Kết nối với hàng trăm nghệ nhân và studio tài năng. Đặt chỗ workshop thủ công, nghệ thuật và trải nghiệm sáng tạo chỉ trong vài giây.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2 rounded-xl bg-background/95 p-3 shadow-2xl backdrop-blur sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Bạn muốn học gì hôm nay?"
                className="border-0 pl-9 shadow-none focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Separator orientation="vertical" className="hidden h-8 self-center sm:block" />
            <div className="relative sm:w-48">
              <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Quận / Huyện"
                className="border-0 pl-9 shadow-none focus-visible:ring-0"
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="shrink-0">
              Tìm Kiếm
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {["Làm Gốm", "Vẽ Tranh", "Làm Nến", "Cắm Hoa"].map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/search?q=${tag}`)}
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-sm text-foreground backdrop-blur transition-colors hover:bg-white/20"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 hidden md:block">
        <img
        src="backgroundherosection.png"
        alt=""
        className="
          relative flex-1 object-cover
          md:inset-y-8 md:right-8 md:left-auto
          md:h-[calc(100%-4rem)] md:aspect-square md:w-auto
          md:rounded-3xl
        "
      /> 
      </div>
    </section>
  )
}

export default HeroSection
