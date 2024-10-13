'use client';
import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  User,
  Search,
  ChevronDown,
  Menu,
  MapPin,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import NavbarButton from './navbar.button';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { api } from '@/config/axios.config';
import { setPosition } from '@/state/position/positionSlice';

interface Address {
  longitude: number;
  latitude: number;
  city: string;
  street: string;
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [address, setAddress] = useState<Address[] | null>(null);
  const dispatch = useDispatch();
  const { city, street } = useSelector((state: RootState) => state.position);
  const session = useSession();
  const [currentLocation, setCurrentLocation] = useState<{
    longitude: number;
    latitude: number;
    city: string;
    street: string;
  } | null>(null);
  const getCurrentPosition = () =>
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          city: 'current',
          street: '',
        });
      },
      (error) => {
        console.error('Error getting current location:', error);
      },
    );

  useEffect(() => {
    const fetchAddresses = async () => {
      api
        .get('/user/get-all-user-addresses', {
          headers: {
            Authorization: 'Bearer ' + session?.data?.user.access_token,
          },
        })
        .then((response) => {
          const initialPosition = response.data.data[0];
          if (!initialPosition) {
            return;
          }
          dispatch(
            setPosition({
              longitude: initialPosition.address.lon,
              latitude: initialPosition.address.lat,
              city: initialPosition.address.City.city,
              street: initialPosition.address.street,
            }),
          );
          const formattedAddresses = response.data.data.map((item: any) => ({
            longitude: item.address.lon,
            latitude: item.address.lat,
            city: item.address.City.city,
            street: item.address.street,
          }));
          setAddress(formattedAddresses);
        });
    };

    if (session.status === 'authenticated') {
      fetchAddresses();
    }
    getCurrentPosition();
  }, [session]);

  return (
    <nav className="sticky top-0 z-50 bg-[#1B8057] text-white">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4">
          <Link href="/">
            <div className="flex items-center space-x-4">
              <ShoppingCart className="h-8 w-8" />
              <span className="text-2xl font-bold">aboda</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center space-x-4 flex-grow mx-8">
            <div className="flex flex-col">
              <span className="text-sm">Location</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 text-white hover:bg-[#39906D] w-full justify-start"
                  >
                    <MapPin className="h-4 w-4 text-[#F8C519]" />
                    <div>
                      {city != 'current'
                        ? `${street}, ${city}`
                        : 'Current location'}
                    </div>
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {currentLocation && (
                    <DropdownMenuItem
                      onSelect={() => dispatch(setPosition(currentLocation))}
                    >
                      Use current location
                    </DropdownMenuItem>
                  )}
                  {address &&
                    address.map((address, index) => (
                      <DropdownMenuItem
                        key={index}
                        onSelect={() => dispatch(setPosition(address))}
                      >
                        {`${address.street}, ${address.city}`}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex-grow">
              <div className="relative w-[80%]">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full py-2 px-4 pr-10 rounded-md bg-[#39906D] focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-[#93C2AF]" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-11">
            <NavbarButton />
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Bottom bar - Desktop */}
        <div className="hidden md:flex justify-between py-2">
          {[
            'Home',
            'Shop',
            'Fruit',
            'Vegetable',
            'Beverages',
            'About Us',
            'Blogs',
          ].map((item) => (
            <Link
              key={item}
              href={`${item === 'Home' ? '/' : '/' + item.toLowerCase()}`}
              className="hover:text-green-200"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="py-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full py-2 px-4 pr-10 rounded-md bg-[#39906D] focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-[#93C2AF]" />
              </div>
            </div>
            <div className="flex flex-col space-y-2 pb-4">
              {[
                'Home',
                'Shop',
                'Fruit',
                'Vegetable',
                'Beverages',
                'About Us',
                'Blogs',
              ].map((item) => (
                <a key={item} href="#" className="hover:text-green-200">
                  {item}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
