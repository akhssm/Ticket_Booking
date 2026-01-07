import { ChartLineIcon, CircleDollarSignIcon, PlayCircleIcon, StarIcon, UsersIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { dummyDashboardData } from '../../assets/assets'
import Loading from '../../Components/Loading'
import Title from '../../Components/admin/Title'
import BlurCircle from '../../Components/BlurCircle'
import { dateFormat } from '../../Lib/dateFormat'

const Dashboard = () => {
  const currency = import.meta.env.VITE_CURRENCY

  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeShows: [],
    totalUser: 0
  })

  const [loading, setLoading] = useState(true)

  const dashboardCards = [
    { title: 'Total Bookings', value: dashboardData.totalBookings, icon: ChartLineIcon },
    { title: 'Total Revenue', value: currency + dashboardData.totalRevenue, icon: CircleDollarSignIcon },
    { title: 'Active Shows', value: dashboardData.activeShows.length, icon: PlayCircleIcon },
    { title: 'Total Users', value: dashboardData.totalUser, icon: UsersIcon }
  ]

  useEffect(() => {
    setDashboardData(dummyDashboardData)
    setLoading(false)
  }, [])

  if (loading) return <Loading />

  return (
    <div className="relative">
      <BlurCircle top="-120px" left="0" />

      <Title text1="Admin" text2="Dashboard" />

      <div className="mt-8 flex gap-6 flex-wrap">
        {dashboardCards.map((card, index) => (
          <div
            key={index}
            className="flex items-center justify-between
            w-56 px-5 py-4
            bg-primary/10 border border-primary/20
            rounded-lg"
          >
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-white">
                {card.title}
              </p>
              <h1 className="text-2xl font-semibold text-white">
                {card.value || 0}
              </h1>
            </div>
            <card.icon className="w-7 h-7 text-white" />
          </div>
        ))}
      </div>

      <p className="mt-10 text-lg font-medium">Active Shows</p>

      <div className="relative flex flex-wrap gap-6 mt-4 max-w-5xl">
        <BlurCircle top="100px" left="-10%" />

        {dashboardData.activeShows.map((show) => (
          <div
            key={show._id}
            className="w-55 rounded-lg overflow-hidden
            h-full pb-3 bg-primary/10 border border-primary/20
            hover:-translate-y-1 transition duration-300"
          >
            <img
              src={show.movie.poster_path}
              alt=""
              className="h-60 w-full object-cover"
            />

            <p className="font-medium p-2 truncate">
              {show.movie.title}
            </p>

            <div className="flex items-center justify-between px-2">
              <p className="text-lg font-medium">
                {currency} {show.showPrice}
              </p>

              <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
                <StarIcon className="w-4 h-4 text-primary fill-primary" />
                {show.movie.vote_average.toFixed(1)}
              </p>
            </div>

            <p className="px-2 pt-2 text-sm text-gray-500">
              {dateFormat(show.showDateTime)}
            </p>
          </div>   
        ))}
      </div>
    </div>
  )
}

export default Dashboard
