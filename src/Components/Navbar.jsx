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
    onFileUpload(null, false, isChecked, true);
  };

  return (
    <nav className="bg-[#2F2F2F] text-white border border-[#2F2F2F] w-full max-w-full">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 lg:py-6 gap-4">
          <div className="flex gap-3 flex-shrink-0">
            <img src={nexaura} alt="logo" className="w-[33.62px] h-[29.07px]" />
            <h2 className="font-readex font-semibold text-xl sm:text-2xl lg:text-[28px] leading-tight tracking-tight text-[#2E8CFF]">
              NEXAURA
            </h2>
          </div>
          <div className="hidden lg:flex flex-col items-center flex-1">
            <div className="mb-2">
              <span className="font-medium text-xl lg:text-2xl xl:text-3xl text-white">
                Assessment Generator
              </span>
            </div>
            <div className="flex space-x-4 text-sm">
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
                className="text-[#848484] font-medium flex items-center gap-2 hover:text-white transition-colors cursor-pointer upload-button"
              >
                <img src={file} alt="upload" />
                Upload
              </button>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center bg-[#0D0D0D] px-4 py-2 rounded-2xl border border-[#282828] w-80">
              <Search size={20} className="text-white mr-2" />
              <input
                type="text"
                placeholder="Search anything here..."
                className="bg-transparent text-white placeholder-gray-400 focus:outline-none flex-1"
              />
            </div>
            <button className="flex items-center justify-center bg-[#0D0D0D] border border-[#282828] rounded-2xl w-12 h-12 hover:bg-[#1a1a1a] transition-colors">
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
        {isMobileMenuOpen && (
          <div className="lg:hidden flex flex-col items-center py-4 space-y-4">
            <span className="font-medium text-lg text-white">Assessment Generator</span>
            <div className="flex flex-col space-y-2 text-sm">
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
                className="text-[#848484] font-medium flex items-center gap-2 hover:text-white transition-colors cursor-pointer bg-[#2F2F2F]"
              >
                <img src={file} alt="upload" />
                Upload
              </button>
            </div>
            <div className="flex items-center bg-[#0D0D0D] px-4 py-2 rounded-2xl border border-[#282828] w-full max-w-[280px]">
              <Search size={20} className="text-white mr-2" />
              <input
                type="text"
                placeholder="Search anything here..."
                className="bg-transparent text-white placeholder-gray-400 focus:outline-none flex-1"
              />
            </div>
            <button className="flex items-center justify-center bg-[#0D0D0D] border border-[#282828] rounded-2xl w-12 h-12 hover:bg-[#1a1a1a] transition-colors">
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
        )}
      </div>
    </nav>
  );
};

export default Navbar;