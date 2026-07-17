'use client'

import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardDescription, CardTitle, CardFooter, CardContent } from '@/components/ui/card'
import Heart from '@/assets/svg/heart'
import { Avatar, AvatarImage, AvatarFallback}  from "@/components/ui/avatar"
import { MapPin } from "lucide-react"

const CardProductDemo = () => {
  const [liked, setLiked] = useState<boolean>(false)

  return (
    <a href="/signin">
    <div className='relative max-w-md rounded-xl bg-background shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer'>
      <div className='flex h-60 items-center justify-center'>
        <img
          src='https://www.workshopsaigon.com/uploads/source/adobestock-98472853.jpg'
          alt='Shoes'
          className='h-full w-full rounded-t-xl object-cover'
        />
      </div>
      <Button className='absolute top-4 left-4 bg-amber-500 text-primary-foreground hover:bg-primary/80'>
        Nổi bật
      </Button>
      <Button
        size='icon'
        onClick={() => setLiked(!liked)}
        className='bg-primary/10 hover:bg-primary/20 absolute top-4 right-4 rounded-full'
      >
        {liked ? <Heart className='fill-destructive stroke-destructive' /> : <Heart className='stroke-white' />}
        <span className='sr-only'>Like</span>
      </Button>
      <Card className='ring-0'>
        <CardHeader>
          <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={12} /> {"Hà Nội, Việt Nam"}
          </div>
          <CardTitle>Làm gốm sứ thủ công, </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className='flex items-center gap-2'>
            <Badge variant='outline' className='rounded-sm'>
              Thủ công
            </Badge>
            <Badge variant='outline' className='rounded-sm'>
              Gốm sứ
            </Badge>
          </CardDescription>
        </CardContent>
        <CardFooter className='justify-between gap-3 max-sm:flex-col max-sm:items-stretch'>
          <div className='flex items-center gap-3'>
            <Avatar>
            <AvatarImage
              src='https://cdn.shadcnstudio.com/ss-assets/components/card/image-12.png?width=300&format=auto'
              alt='Avatar'
            />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <p>Nhà làm</p>
          </div>

          <div className='flex flex-col'>
            <span className='text-sm font-medium uppercase'>Price</span>
            <span className='text-xl font-semibold'>$69.99</span>
          </div>
        </CardFooter>
      </Card>
    </div>
    </a>
  )
}

export default CardProductDemo
