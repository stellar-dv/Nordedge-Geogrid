import { getGridResultById } from "@/lib/geogrid-service"
import { DetailedGridView } from "@/components/detailed-grid-view"
import { notFound } from "next/navigation"

export default async function GridDetailPage({ params }: { params: { id: string } }) {
  const gridResult = await getGridResultById(params.id)

  if (!gridResult) {
    notFound()
  }

  return <DetailedGridView gridResult={gridResult} />
}
