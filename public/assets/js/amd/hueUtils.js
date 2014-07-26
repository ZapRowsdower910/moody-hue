define(function(){
	
	var methods = {
		toXY : function(x,y,bri){
          
        },
        correctGamma : function(color){
          return color <= 0.0031308 ? 
                12.92 * color :
                 (1.0 + 0.055) * Math.pow(color, (1.0 / 2.4)) - 0.055;
        },
        toRGB : function(x,y,bri){
          try{
            console.log("args [%o]",arguments);

            var z = 1.0 - x - y;

            var X = (bri / y) * x;
            var Z = (bri / y) * z;
            console.log("X,Z,bri " ,X,Z,bri);

            var r = X  * 3.2410 - bri * 1.5374 - Z * 0.4986;
            var g = -X * 0.9692 + bri * 1.8760 + Z * 0.0416;
            var b = X  * 0.0556 - bri * 0.2040 + Z * 1.0570;

            console.log("rgb before ", r,g,b);

            r = Math.floor(colors.correctGamma(r));
            g = Math.floor(colors.correctGamma(g));
            b = Math.floor(colors.correctGamma(b));

            console.log("rgb after gamma ", r,g,b);
          } catch(e){
            console.error(e);
          }

          return [r,g,b];
        },
        xyBriToRgb : function(x, y, bri){
            z = 1.0 - x - y;
            Y = bri / 255.0; // Brightness of lamp
            X = (Y / y) * x;
            Z = (Y / y) * z;
            r = X * 1.612 - Y * 0.203 - Z * 0.302;
            g = -X * 0.509 + Y * 1.412 + Z * 0.066;
            b = X * 0.026 - Y * 0.072 + Z * 0.962;
            r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
            g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
            b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;
            maxValue = Math.max(r,g,b);
            r /= maxValue;
            g /= maxValue;
            b /= maxValue;
            r = r * 255;   if (r < 0) { r = 255 };
            g = g * 255;   if (g < 0) { g = 255 };
            b = b * 255;   if (b < 0) { b = 255 };
            return {
                r : Math.floor(r),
                g : Math.floor(g),
                b : Math.floor(b)
            }
        }
	};

	return methods;
});