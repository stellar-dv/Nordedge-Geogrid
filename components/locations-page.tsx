"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"

export function LocationsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Locations</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add new location
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">States</label>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Search" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Search" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Folders</label>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Search" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Accounts</label>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Search" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6">
        <Input placeholder="Name, Address, Place ID" className="max-w-md" />
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Checkbox id="all" checked />
          <label htmlFor="all" className="text-sm">
            All
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="enabled" />
          <label htmlFor="enabled" className="text-sm">
            Enabled
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="disabled" />
          <label htmlFor="disabled" className="text-sm">
            Disabled
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="with-keywords" />
          <label htmlFor="with-keywords" className="text-sm">
            With keywords
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-600">
          <div className="col-span-1"></div>
          <div className="col-span-3">Locations</div>
          <div className="col-span-4">Address</div>
          <div className="col-span-2">Keywords</div>
          <div className="col-span-2">Accounts</div>
        </div>

        <div className="grid grid-cols-12 gap-4 p-4 items-center border-b border-gray-100 hover:bg-gray-50">
          <div className="col-span-1">
            <Checkbox />
          </div>
          <div className="col-span-3">
            <div className="text-blue-600 hover:underline font-medium">Restaurang Tigris (Vedugns Pizzeria)</div>
          </div>
          <div className="col-span-4">Järnvägsgatan 10, 686 30 Sunne, Sweden</div>
          <div className="col-span-2"></div>
          <div className="col-span-2">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-xs">C</span>
              </div>
              <div className="ml-2 text-sm text-gray-500">No API connection</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 p-4 items-center border-b border-gray-100 hover:bg-gray-50 bg-gray-50/50">
          <div className="col-span-1">
            <Checkbox />
          </div>
          <div className="col-span-3">
            <div className="text-blue-600 hover:underline font-medium">Må Bra i Riksby AB</div>
          </div>
          <div className="col-span-4">Riksbyvägen 19b, 168 74 Bromma, Sweden</div>
          <div className="col-span-2"></div>
          <div className="col-span-2">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-600 text-xs">G</span>
              </div>
              <div className="ml-2 text-sm text-gray-500">No API connection</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
