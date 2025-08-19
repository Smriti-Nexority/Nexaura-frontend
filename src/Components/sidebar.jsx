import React,{useState} from 'react';
// import nexaura from './Components_assets/Vector.svg';
import '../App.css';
import dashboardIcon from'./Components_assets/dashboard-square-01.svg'
import Navbar from './Navbar';


const Sidebar = () => {

    // Menu items
  const menuItems = [
    { name: 'Assignment generator', icon:<img src={dashboardIcon} alt="dashboardIcon" /> },
    // You can add more items later
  ];
  // Active state
  const [activeItem, setActiveItem] = useState('Assignment generator');

  return (
    <>      
    <aside className="bg-[#2F2F2F] h-[1024px] flex flex-col  w-[263px] border-[1px] border-[#2F2F2F] ">
    <div className= 'border-[1px] border-[#2F2F2F]'>
   
    
    </div>
     
    

     {/* Main Section */}
      <span className="text-[#848484] text-sm mb-3 ml-[14px] mt-[20px] h-[16px] w-[203px]"
      style={{
          fontFamily: 'Inter',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '16px',
          letterSpacing: '0%',
        }}>MAIN</span>

      {/* Menu items */}
      <div className="flex flex-col gap-3 ml-[14px]">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveItem(item.name)}
            className={`flex items-center gap-3`}
            style={{
              width: '234px',
              height: '48px',
              background: '#171717',
              border: `1px solid ${activeItem === item.name ? '#0969DE' : 'transparent'}`,
              borderRadius: '6px',
              padding: '12px',
              opacity: 1,
              gap: '8px',
            }}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium text-sm h-[24px] w-[171px] text-[#0969DE]"
            style={{
                fontfamily: "Inter",
                fontweight: "500",
                fontstyle: "Medium",
                fontsize: "16px",
                leadingtrim: "NONE",
                lineheight: "24px",
                letterspacing: "0%"
            }}>{item.name}</span>
          </button>
        ))}
      </div>  
    </aside>
    
    
    </>
  );
};

export default Sidebar;
