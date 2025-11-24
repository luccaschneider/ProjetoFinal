import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { Calendar, Award, FileText, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Sistema de Gerenciamento de Eventos
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore eventos, gerencie suas inscrições e obtenha certificados de participação
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button asChild size="lg">
                <Link href="/events" className="flex items-center gap-2">
                  Explorar Eventos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Entrar</Link>
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Eventos</CardTitle>
                <CardDescription className="text-sm">
                  Explore eventos disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/events">Ver Eventos</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Inscrições</CardTitle>
                <CardDescription className="text-sm">
                  Gerencie suas inscrições
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/my-events">Meus Eventos</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Presenças</CardTitle>
                <CardDescription className="text-sm">
                  Visualize suas presenças
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/my-attendances">Minhas Presenças</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Certificados</CardTitle>
                <CardDescription className="text-sm">
                  Gere seus certificados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/certificates">Certificados</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
