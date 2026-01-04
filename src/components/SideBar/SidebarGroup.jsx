import SidebarItem from "./SidebarItem";

export default function SidebarGroup({ group, items }) {
    return (
        <div className="mb-4">
            <div className="px-2 mb-2 text-xs uppercase tracking-wider text-slate-500">
                {group}
            </div>

            <div className="space-y-1">
                {items.map((item) => (
                    <SidebarItem key={item.to} {...item} />
                ))}
            </div>
        </div>
    );
}
