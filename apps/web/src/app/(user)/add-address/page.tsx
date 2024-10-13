'use client';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { api } from '@/config/axios.config';

export default function AddAddress() {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [street, setStreet] = useState<string>('');
  const [lon, setLon] = useState<string>('');
  const [lat, setLat] = useState<string>('');
  const session = useSession();

  // Fetch provinces when component mounts
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await api.get('/address/get-provinces');
        setProvinces(res.data.data);
      } catch (error) {
        console.error('Error fetching provinces:', error);
      }
    };

    if (session.status === 'authenticated') {
      fetchProvinces();
    }
  }, [session]);

  // Fetch cities based on selected province
  useEffect(() => {
    const fetchCities = async () => {
      if (!selectedProvince) return;

      try {
        const res = await api.get(
          `/address/get-city-by-province?provinceId=${selectedProvince}`,
          {
            headers: {
              Authorization: 'Bearer ' + session?.data?.user.access_token,
            },
          },
        );
        setCities(res.data.data);
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };

    if (selectedProvince) {
      fetchCities();
    }
  }, [selectedProvince, session]);

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post(
        '/address/add-user-address',
        {
          street,
          cityId: selectedCity,
          lon,
          lat,
        },
        {
          headers: {
            Authorization: 'Bearer ' + session?.data?.user.access_token,
          },
        },
      );

      console.log('Address added successfully:', res.data);
      alert('Address added successfully!');
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-3xl font-bold mb-1 text-center">Add Address</h1>
      <p className="text-sm text-gray-500 mb-8 text-center">
        <a href="/" className="hover:underline">
          Home
        </a>{' '}
        / Add Address
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          placeholder="Street Address"
          value={street}
          onChange={(e) => setStreet(e.target.value)} // Set street state
        />

        <Select onValueChange={(value) => setSelectedProvince(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Province" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.id} value={province.id.toString()}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => setSelectedCity(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select City" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id.toString()}>
                {city.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Longitude"
          value={lon}
          onChange={(e) => setLon(e.target.value)} // Set longitude state
        />
        <Input
          placeholder="Latitude"
          value={lat}
          onChange={(e) => setLat(e.target.value)} // Set latitude state
        />

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          Save
        </Button>
      </form>
    </div>
  );
}