const BlurCircle = ({ top = "auto", left = "auto", right = "auto", bottom = "auto"}) => {
  return (
    <div
      className="absolute z-0 h-64 w-64 rounded-full bg-primary/30 blur-3xl"
      style={{ top, left, right, bottom }}
    />
  )
}

export default BlurCircle
