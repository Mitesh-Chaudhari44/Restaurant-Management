import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutGrid, Menu, ClipboardList, TableProperties, ChefHat, Users } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutGrid, image: "/images/restaurant.svg" },
  { href: "/menu", label: "Menu", icon: Menu, image: "/images/food-1.svg" },
  { href: "/orders", label: "Orders", icon: ClipboardList, image: "/images/food-2.svg" },
  { href: "/tables", label: "Tables", icon: TableProperties, image: "/images/table.svg" },
  { href: "/kitchen", label: "Kitchen", icon: ChefHat, image: "/images/kitchen.svg" },
  { href: "/customers", label: "Customers", icon: Users, image: "/images/customers.svg" },
];

export default function Nav() {
  const [location] = useLocation();

  return (
    <nav className="border-b bg-gradient-to-r from-amber-50 to-orange-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          <div className="flex items-center mr-8">
            <Link href="/">
              <img src="/images/restaurant-logo.svg" alt="Restaurant Logo" className="h-10 w-10 mr-2 hover:scale-110 transition-transform cursor-pointer" />
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
              Restaurant Manager
            </h1>
          </div>
          <div className="flex space-x-4">
            {navItems.map(({ href, label, icon: Icon, image }) => (
              <Link key={href} href={href}>
                <span
                  className={cn(
                    "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location === href
                      ? "bg-gradient-to-br from-amber-400 to-orange-400 text-white font-semibold shadow-md"
                      : "text-muted-foreground hover:text-amber-800 hover:bg-amber-100"
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}