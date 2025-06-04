'use client'

import { Mail, Phone, MapPin, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // TODO: Implement actual form submission logic
    console.log('Form data submitted:', formData);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsLoading(false);
    setSuccess('Votre message a été envoyé !');
    setFormData({ name: '', email: '', message: '' }); // Clear form
  };

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Nous Contacter</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Informations de contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-700">
                <div className="flex items-center">
                  <Phone className="mr-3 h-5 w-5 text-orange-600" />
                  <span>+33 1 23 45 67 89</span>
                </div>
                <div className="flex items-center">
                  <Mail className="mr-3 h-5 w-5 text-orange-600" />
                  <span>contact@bellapizza.fr</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="mr-3 h-5 w-5 text-orange-600 flex-shrink-0 mt-1" />
                  <span>147 Avenue de la République, 75011 Paris</span>
                </div>
                {/* Link to Google Maps */}
                <div className="flex items-center">
                   <a 
                     href="https://www.google.com/maps/place/147+Avenue+de+la+République,+75011+Paris"
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-orange-600 hover:text-orange-700 text-sm inline-flex items-center"
                   >
                     Voir sur Google Maps
                     <ArrowRight className="ml-2 h-4 w-4" />
                   </a>
                 </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="space-y-6">
             <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Envoyez-nous un message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Error/Success Alerts */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="border-green-200 bg-green-50 text-green-800">
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      rows={5}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Envoyer le message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 