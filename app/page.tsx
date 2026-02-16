import Link from "next/link";
import { Button } from "@/components/ui/button";
import Header from "@/components/landing/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, FileText, CreditCard, Megaphone } from "lucide-react";
import { getAnnouncementsForStudent } from "@/db/queries";
import { getRoleDisplayLabel } from "@/lib/announcements/roleLabel";

export default async function LandingPage() {
  const announcements = await getAnnouncementsForStudent(5, null);
    return (
        <div className="relative min-h-screen flex flex-col overflow-hidden">
            {/* Subtle background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100" />
            <div className="pointer-events-none absolute -top-28 -left-28 h-[520px] w-[520px] rounded-full bg-corus-maroon/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -right-28 h-[560px] w-[560px] rounded-full bg-corus-maroon-dark/15 blur-3xl" />
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, rgba(0,0,0,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.6) 1px, transparent 1px)",
                    backgroundSize: "36px 36px",
                }}
            />
            {/* Page content */}
			{/* Header */}
            <Header showActions />

			{/* Hero */}
            <section className="relative z-10 w-full bg-white/60">
                <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
					<div className="text-center md:text-left">
						<h1 className="text-4xl md:text-5xl font-bold text-corus-maroon">Welcome to CORUS</h1>
						<p className="mt-4 text-gray-700">
							OLSHCO’s official online portal for enrollment, student records, grades, schedules, and college services.
						</p>
						<div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-center md:justify-start">
							<Link href="/login">
								<Button className="w-full sm:w-auto">Login</Button>
							</Link>
							<Link href="/register">
								<Button className="w-full sm:w-auto" variant="outline">Register as New Student</Button>
							</Link>
						</div>
					</div>
					<div className="hidden md:block">
						<div className="h-64 rounded-lg bg-gray-100 border flex items-center justify-center text-gray-400">
							Academic Illustration
						</div>
					</div>
				</div>
			</section>

			{/* Announcements */}
			{announcements.length > 0 && (
				<section className="relative z-10 w-full bg-white/60">
					<div className="mx-auto max-w-6xl px-4 py-14">
						<h2 className="text-2xl font-semibold text-corus-maroon mb-6">Announcements</h2>
						<div className="space-y-4">
							{announcements.map((a) => (
								<Card key={a.id} className={a.pinned ? "border-corus-maroon/30 shadow" : "border-corus-maroon/20 shadow"}>
									<CardHeader className="pb-2">
										<div className="flex flex-wrap items-center gap-2">
											{a.pinned && (
												<span className="rounded bg-corus-maroon/10 px-2 py-0.5 text-xs font-medium text-corus-maroon">
													Pinned
												</span>
											)}
											<span className="text-xs font-semibold uppercase text-corus-maroon">
												{getRoleDisplayLabel(a.createdByRole)}
											</span>
										</div>
										<CardTitle className="mt-3 text-base text-corus-maroon">{a.title}</CardTitle>
										<p className="text-xs text-gray-500">
											{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
										</p>
									</CardHeader>
									<CardContent>
										<div className="whitespace-pre-wrap text-sm text-gray-700 line-clamp-3">{a.body}</div>
									</CardContent>
								</Card>
							))}
						</div>
						<div className="mt-4">
							<Link href="/login" className="text-sm font-medium text-corus-maroon hover:underline">
								Login to view all announcements →
							</Link>
						</div>
					</div>
				</section>
			)}

			{/* Features */}
            <section className="relative z-10 w-full">
                <div className="mx-auto max-w-6xl px-4 py-14">
					<h2 className="text-2xl font-semibold text-corus-maroon mb-6">Features</h2>
					<div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
						<Card className="shadow border-corus-maroon/20">
							<CardHeader>
								<CardTitle className="text-corus-maroon flex items-center gap-2"><GraduationCap size={18} /> Online Enrollment</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-700">Register for classes and manage your enrollment online.</CardContent>
						</Card>
						<Card className="shadow border-corus-maroon/20">
							<CardHeader>
								<CardTitle className="text-corus-maroon flex items-center gap-2"><FileText size={18} /> Grades & Records</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-700">View grades, academic records, schedules, and more.</CardContent>
						</Card>
						<Card className="shadow border-corus-maroon/20">
							<CardHeader>
								<CardTitle className="text-corus-maroon flex items-center gap-2"><CreditCard size={18} /> Billing & Payments</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-700">Track tuition statements and pay securely online.</CardContent>
						</Card>
						<Card className="shadow border-corus-maroon/20">
							<CardHeader>
								<CardTitle className="text-corus-maroon flex items-center gap-2"><Megaphone size={18} /> Announcements & Classes</CardTitle>
							</CardHeader>
							<CardContent className="text-gray-700">Stay updated with college announcements and class info.</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* About */}
            <section className="relative z-10 w-full">
                <div className="mx-auto max-w-6xl px-4 py-14">
					<h2 className="text-2xl font-semibold text-gray-900 mb-4">About</h2>
					<p className="text-gray-700 max-w-3xl">
						CORUS is the official online student portal of Our Lady of the Sacred Heart College of Guimba. It provides online enrollment, records access, grades, schedules, payment tracking, and secure college services.
					</p>
				</div>
			</section>

			{/* Footer */}
            <footer className="relative z-10 mt-auto w-full bg-corus-maroon text-white">
				<div className="mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
					<div className="font-semibold">CORUS</div>
					<nav className="flex gap-4 text-sm">
						<Link href="#">About</Link>
						<Link href="#">Contact</Link>
						<Link href="#">Privacy</Link>
					</nav>
					<div className="text-sm">© {new Date().getFullYear()} OLSHCO. All rights reserved.</div>
				</div>
			</footer>
		</div>
	);
}