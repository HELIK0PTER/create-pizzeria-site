import React from 'react'
import { Badge } from '../ui/badge';
import { PizzaBaseType } from '@prisma/client';

const BaseBadge = ({ baseType }: { baseType: PizzaBaseType }) => {

  const baseTypeLabel = {
    [PizzaBaseType.Tomate]: 'Tomate',
    [PizzaBaseType.Crème]: 'Crème',
    [PizzaBaseType.Barbecue]: 'Barbecue',
  }

  const baseTypeColor = {
    [PizzaBaseType.Tomate]: 'bg-red-100 text-red-800',
    [PizzaBaseType.Crème]: 'bg-blue-100 text-blue-800',
    [PizzaBaseType.Barbecue]: 'bg-orange-100 text-orange-800',
  }

  return (
    <div>
      <Badge variant="secondary" className={baseTypeColor[baseType]}>
        {baseTypeLabel[baseType]}
      </Badge>
    </div>
  )
}

export default BaseBadge;
