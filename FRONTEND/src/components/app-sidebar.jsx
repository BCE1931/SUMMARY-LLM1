import React, { useEffect, useState } from "react";
import { MoreHorizontal, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarFooter,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { SpinnerCustom } from "@/components/ui/spinner";

export function AppSidebar() {
  const [records, setRecords] = useState([]);
  const [fetching, setFetching] = useState(false);
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "";
  const isLoggedIn = username && username.trim() !== "";

  const handleFetch = async () => {
    if (!isLoggedIn) return;

    try {
      setFetching(true);
      const resp = await fetch(
        `https://springappllm.azurewebsites.net/get/${username}`
      );
      if (!resp.ok) {
        console.log("Error fetching previous records");
        return;
      }
      const data = await resp.json();
      console.log("Fetched records:", data);
      setRecords(data);
    } catch (e) {
      console.error("Error fetching records:", e.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    handleFetch();
  }, [username]);

  const handleRecordClick = (record) =>
    navigate("/Selection", { state: record });

  const handleHomeClick = () => navigate("/Selection", { state: null });

  const updateContent = (id) =>
    setRecords((prevRecords) => prevRecords.filter((item) => item.id !== id));

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    setFetching(true);
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("id", id);

      const resp = await fetch("http://localhost:8080/delete", {
        method: "DELETE",
        body: formData,
      });

      if (!resp.ok) {
        alert("Error deleting record");
        return;
      }

      console.log(`Record ${id} deleted successfully`);
      updateContent(id);
    } catch (e) {
      console.error("Delete failed:", e.message);
    } finally {
      setFetching(false);
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex flex-col space-y-1">
                  <SidebarMenuButton asChild>
                    <button
                      onClick={handleHomeClick}
                      className="w-full text-left font-medium hover:text-primary flex items-center space-x-2"
                    >
                      🏠 <span>Home</span>
                    </button>
                  </SidebarMenuButton>

                  <SidebarMenuButton asChild>
                    <a
                      href="https://github.com/BCE1931/SUMMARY-LLM1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left font-medium hover:text-primary flex items-center space-x-2"
                    >
                      💻 <span>GitHub Code</span>
                    </a>
                  </SidebarMenuButton>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isLoggedIn ? (
          <p className="text-sm text-muted-foreground px-3 py-2">
            Please log in to see your uploads.
          </p>
        ) : fetching ? (
          <div className="flex items-center justify-center py-6">
            <SpinnerCustom />
          </div>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Previous Uploads</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {records.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-3 py-2">
                    No previous uploads
                  </p>
                ) : (
                  records.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild>
                        <button
                          onClick={() => handleRecordClick(item)}
                          className="flex items-center justify-between truncate w-full text-left hover:bg-accent/50 rounded-md px-2 py-1"
                          title={item.title}
                        >
                          <span>{item.title || "Untitled"}</span>
                        </button>
                      </SidebarMenuButton>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction>
                            <MoreHorizontal className="w-4 h-4" />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem
                            onClick={() =>
                              alert(
                                `Edit feature coming soon for ${item.title}`
                              )
                            }
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(item.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ))
                )}
                <p className="text-sm text-muted-foreground px-3 py-2">
                  Please relod the page in to see recent uploads.
                </p>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-border pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full flex justify-between items-center">
                  <span>{isLoggedIn ? username : "Guest"}</span>
                  <ChevronUp className="w-4 h-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-64 h-auto">
                {isLoggedIn ? (
                  <>
                    <DropdownMenuItem>
                      <span>Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>Billing</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        localStorage.removeItem("username");
                        navigate("/");
                      }}
                    >
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      navigate("/");
                    }}
                  >
                    <span>Sign In</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
