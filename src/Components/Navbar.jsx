import React, { useState } from 'react';
import { Menu, X, Search, Bell, ChevronDown } from 'lucide-react';
import nexaura from './Components_assets/vector.svg';
import profile from './Components_assets/img.jpg';
import chart from './Components_assets/chart-bar-line.svg';
import file from './Components_assets/file-02.svg';

const Navbar = ({ onFileUpload }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleUploadClick = () => {
    // Trigger file upload modal without affecting question generation
    onFileUpload(null, false, isChecked, true);
  };

  return (
    <nav className="bg-[#2F2F2F] text-white border-1 border-[#2F2F2F] relative w-[100vw] h-[124px]">
      <div className="max-w-7xl px-4 sm:px-4 lg:px-8 sm:w-full">
        <div className="flex items-center justify-between h-16 lg:h-24">
          <div className="flex gap-[11.53px]">
            <img src={nexaura} alt="logo" className="w-[33.62px] h-[29.07px]" />
            <h2 className="font-readex font-semibold text-[28px] leading-[40px] tracking-[-0.05em] text-[#2E8CFF]">
              NEXAURA
            </h2>
          </div>
          <div className="hidden lg:flex flex-col items-center mt-[24px] ml-[-160px]">
            <div className="mb-2">
              <span className="font-medium text-2xl xl:text-3xl text-white">
                Assessment Generator
              </span>
            </div>
            <div className="flex space-x-6 text-sm">
              <div className="text-[#0969DE] font-medium flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4"
                />
                Subject
              </div>
              <div className="text-[#848484] font-medium flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                <img src={chart} alt="subject" />
                Text
              </div>
              <button
                onClick={handleUploadClick}
                className="text-[#848484] font-medium flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
              >
                <img src={file} alt="upload" />
                Upload
              </button>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-4 ml-[24px] mr-[-200px] relative md:shrink">
            <div className="flex items-center bg-[#0D0D0D] px-4 py-2 rounded-2xl border-1 border-[#282828] w-80">
              <Search size={20} className="text-white mr-2" />
              <input
                type="text"
                placeholder="Search anything here..."
                className="bg-transparent text-white placeholder-gray-400 focus:outline-none flex-1"
              />
            </div>
            <button className="flex items-center justify-center bg-[#0D0D0D] border-1 border-[#282828] rounded-2xl w-12 h-12 hover:bg-[#1a1a1a] transition-colors">
              <Bell size={20} />
            </button>
            <div className="flex items-center justify-between bg-[#0D0D0D] border border-[#282828] rounded-[6px] w-[100px] h-12 hover:bg-[#1a1a1a] transition-colors">
              <img
                className="w-12 h-12 object-cover rounded-[6px]"
                src={profile}
                alt="profile"
              />
              <ChevronDown size={20} className="text-white mr-3" />
            </div>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-md hover:bg-[#404040] transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;