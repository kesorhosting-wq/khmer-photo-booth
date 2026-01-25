import pinkBow from "@/assets/pink-bow.gif";

export const DecorativeSection = () => {
  return (
    <div className="flex items-center justify-center gap-4 py-6">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/50 to-gold/30" />
      <img 
        src={pinkBow} 
        alt="" 
        className="w-16 h-16 md:w-20 md:h-20 object-contain animate-float"
      />
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gold/50 to-gold/30" />
    </div>
  );
};
