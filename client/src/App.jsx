import React from 'react'
import NavBar from './Components/NavBar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './Pages/Home'
import Movies from './Pages/Movies'
import MovieDetails from './Pages/MovieDetails'
import SeatLayout from './Pages/SeatLayout'
import MyBookings from './Pages/MyBookings'
import Favourite from './Pages/Favourite'
import { Toaster } from 'react-hot-toast'
import Footer from './Components/Footer'     

const App = () => {

  const isAdminRoute = useLocation().pathname.startsWith('/admin');

  return (
    <>
      <Toaster />
      {!isAdminRoute && <NavBar/>}
      <Routes>
        <Route path='/' elemment={<Home/>} />
        <Route path='/movies' elemment={<Movies/>} />
        <Route path='/movies/:id' elemment={<MovieDetails/>} />
        <Route path='/movies/:id/:date' elemment={<SeatLayout/>} />
        <Route path='/my-bookings' elemment={<MyBookings/>} />
        <Route path='/favourite' elemment={<Favourite/>} />
      </Routes>
        {!isAdminRoute && <Footer />}
    </>
  )
}

export default App
