import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assets, dummyDateTimeData, dummyShowsData } from '../assets/assets'
import Loading from '../Components/Loading'
import { ArrowRightIcon, ClockIcon } from 'lucide-react'
import isoTimeFormat from '../Lib/isoTimeFormat'
import BlurCircle from '../Components/BlurCircle'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'

const SeatLayout = () => {

  const groupRows = [["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"], ["I", "J"]]

  const { id, date } = useParams()
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedTime, setSelectedTime] = useState(null)
  const [show, setShow] = useState(null)
  const [occupiedSeats, setOccupiedSeats] = useState([])

  const navigate = useNavigate()

  const {axios, getToken, user} = useAppContext();

  const getShow = async () => {
    try {
      const{ data } = await axios.get(`/api/show/${id}`)
      if(data.success){
        setShow(data)
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getShow()
  }, [id])

  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast.error("Please select a time and seats")
    }

    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5) {
      return toast.error("You can only select 5 seats")
    }

    if(occupiedSeats.includes(seatId)){
      return toast.error('This seat is already booked')
    }

    setSelectedSeats(prev =>
      prev.includes(seatId)
        ? prev.filter(seat => seat !== seatId)
        : [...prev, seatId]
    )
  }

  const renderSeats = (row) => {
    const totalSeats = 10
    return (
      <div key={row} className="flex items-center gap-2 mb-2">
        <span className="w-4 text-gray-400">{row}</span>

        {Array.from({ length: totalSeats }).map((_, i) => {
          const seatId = `${row}${i + 1}`
          const isSelected = selectedSeats.includes(seatId)

          return (
            <button key={seatId} onClick={() => handleSeatClick(seatId)}
              className={`w-7 h-7 rounded-sm border text-xs transition
                ${isSelected ? 'bg-primary text-white border-primary'
                    : 'border-gray-500 hover:bg-primary/30'}
                    ${occupiedSeats.includes(seatId) && "opacity-50"}`} >
              {i + 1}
            </button>
          )
        })}
      </div>
    )
  }

  const getOccupiedSeats = async () => {
    try {
      const { data } = await axios.get(`/api/booking/seats/${selectedTime.showId}`)
      if(data.success) {
        setOccupiedSeats(data.occupiedSeats)
      }else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
    }
  }

const bookTickets = async () => {
  try {
    if (!user) {
      return toast.error('Please login to proceed')
    }
    
    if (!selectedTime || selectedSeats.length === 0) {
      return toast.error('Please select a time and seats')
    }
    
    const { data } = await axios.post(
      '/api/booking/create',
      {
        showId: selectedTime.showId,
        selectedSeats,
      },
      {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      }
    )
    
    if (data.success) {
      window.location.href = data.url;
    } else {
      toast.error(data.message)
    }
  } catch (error) {
    console.error(error)
    toast.error(error.response?.data?.message || error.message)
  }
}


  useEffect(() => {
    if(selectedTime){
      getOccupiedSeats()
    }
  },[selectedTime])

  if (!show) return <Loading />
  return (
    <div className="flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50 gap-10">
      <div className="w-60 bg-primary/10 border border-primary/20 rounded-lg py-10
        h-max md:sticky md:top-30">
        <p className="text-lg font-semibold px-6">Available Timings</p>

        <div className="mt-5 space-y-1">
          {show.dateTime[date]?.map(item => (
            <div
              key={item.time}
              onClick={() => setSelectedTime(item)}
              className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md
              cursor-pointer transition
              ${
                selectedTime?.time === item.time
                  ? "bg-primary text-white"
                  : "hover:bg-primary/20"
              }`}
            >
              <ClockIcon className="w-4 h-4" />
              <p className="text-sm">{isoTimeFormat(item.time)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex-1 flex flex-col items-center max-md:mt-16">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0" right="0" />

        <h1 className="text-2xl font-semibold mb-4">Select Your Seat</h1>
        <img src={assets.screenImage} alt="screen" />
        <p className="text-gray-400 text-sm mb-6">SCREEN SIDE</p>

        <div className="flex flex-col items-center mt-10 text-xs text-gray-300 gap-6">
          {groupRows.map((group, idx) => (
            <div key={idx} className="flex gap-8">
              {group.map(row => renderSeats(row))}
            </div>
          ))}
        </div>

        <button onClick={bookTickets} className='flex items-center gap-1 mt-20 px-10 py-3 text-sm
        bg-primary hover:bg-primary-dull transition rounded-full font-medium
        cursor-pointer active:scale-95'>
          Proceed To Checkout
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default SeatLayout
